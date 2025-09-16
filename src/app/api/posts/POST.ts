/**
 * POST /api/posts
 * - Allows an authenticated user to create a post.
 */
import { serverWritePost } from '@/hooks/serverWritePost';

export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum allowed duration: 60 seconds

export async function POST(request: Request) {
  const formData = await request.formData();
  return serverWritePost({ formData, type: 'create' });
}
