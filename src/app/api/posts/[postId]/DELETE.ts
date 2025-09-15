/**
 * DELETE /api/posts/:postId
 * - Allows an authenticated user to delete a post.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { deleteObject } from '@/lib/tos/deleteObject';
import { verifyAccessToPost } from './verifyAccessToPost';

export async function DELETE(request: Request, { params }: { params: { postId: string } }) {
  try {
    const postId = parseInt(params.postId, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    if (!(await verifyAccessToPost(postId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the `post` and the associated `visualMedia` from the database
    const res = await prisma.post.delete({
      select: {
        id: true,
        visualMedia: true,
      },
      where: {
        id: postId,
      },
    });

    // Try to delete the associated `visualMedia` files from the TOS bucket
    // But don't fail if this doesn't work (files might already be deleted)
    if (res.visualMedia && res.visualMedia.length > 0) {
      const filenames = res.visualMedia.map((m) => m.fileName);
      try {
        await Promise.all(filenames.map(deleteObject));
      } catch (deleteError) {
        // Log the error but don't fail the request
        console.error('Error deleting visual media files:', deleteError);
      }
    }

    return NextResponse.json({ id: res.id });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
