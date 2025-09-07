/**
 * GET /api/posts/tasks
 * - Returns task posts for authenticated users
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { selectPost } from '@/lib/prisma/selectPost';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { GetPost } from '@/types/definitions';

export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();
    if (!user) return NextResponse.json({}, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortDirection = searchParams.get('sort-direction') || 'desc';

    const rawPosts = await prisma.post.findMany({
      where: {
        isTask: true,
        // Show all task posts
      },
      select: selectPost(user.id),
      orderBy: {
        id: sortDirection as 'asc' | 'desc',
      },
      take: limit,
      skip: cursor > 0 ? 1 : 0,
      cursor: cursor > 0 ? { id: cursor } : undefined,
    });

    const posts: GetPost[] = await Promise.all(rawPosts.map((post) => toGetPost(post)));
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load task posts' }, { status: 500 });
  }
}
