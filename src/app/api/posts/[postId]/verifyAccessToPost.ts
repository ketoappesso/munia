import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export const verifyAccessToPost = async (postId: number) => {
  const [user] = await getServerUser();

  if (!user) return false;

  // Check if user is super admin (phone number 18874748888)
  if (user.phoneNumber === '18874748888') {
    return true;
  }

  // Check if user owns the post
  const count = await prisma.post.count({
    where: {
      id: postId,
      userId: user.id,
    },
  });

  return count > 0;
};
