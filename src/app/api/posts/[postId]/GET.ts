/**
 * GET /api/posts/:postId
 * - Returns the data of a specific post.
 */

import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { selectPost } from '@/lib/prisma/selectPost';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { NextResponse } from 'next/server';
import { GetPost } from '@/types/definitions';

export async function GET(request: Request, { params }: { params: { postId: string } }) {
  /**
   * The [user] will only be used to check whether the
   * user requesting the Post has like it or not.
   */
  const [user] = await getServerUser();
  const res = await prisma.post.findUnique({
    where: {
      id: parseInt(params.postId, 10),
    },
    select: selectPost(user?.id),
  });

  if (res === null) return NextResponse.json(null);
  
  // Debug: Log the user data being returned
  console.log('API Post User Data:', {
    postId: params.postId,
    userId: res.user?.id,
    username: res.user?.username,
    phoneNumber: res.user?.phoneNumber,
    ttsVoiceId: res.user?.ttsVoiceId,
  });
  
  return NextResponse.json<GetPost>(await toGetPost(res));
}
