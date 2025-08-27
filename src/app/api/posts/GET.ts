/**
 * GET /api/posts
 * - Returns public posts for unauthenticated users
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { selectPost } from '@/lib/prisma/selectPost';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortDirection = searchParams.get('sort-direction') || 'desc';

    const posts = await prisma.post.findMany({
      where: {
        // Only show posts from public users (you might want to add additional filters)
        user: {
          // Add any public user filters here if needed
        },
      },
      select: selectPost(undefined), // No user ID for public posts
      orderBy: {
        id: sortDirection as 'asc' | 'desc',
      },
      take: limit,
      skip: cursor > 0 ? 1 : 0,
      cursor: cursor > 0 ? { id: cursor } : undefined,
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
