import prisma from '@/lib/prisma/prisma';

/**
 * Update user's last activity timestamp
 */
export async function updateUserActivity(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
}

/**
 * Check if a user is AFK (Away From Keyboard)
 * User is considered AFK if they haven't been active for 15 minutes
 */
export async function isUserAFK(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActivityAt: true },
    });

    if (!user) {
      return false; // User doesn't exist
    }

    if (!user.lastActivityAt) {
      return true; // If no activity record, assume user is AFK (for backward compatibility)
    }

    const now = new Date();
    const lastActivity = new Date(user.lastActivityAt);
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

    return (now.getTime() - lastActivity.getTime()) > fifteenMinutes;
  } catch (error) {
    console.error('Failed to check AFK status:', error);
    return false;
  }
}

/**
 * Get user's AFK status with last activity time
 */
export async function getUserActivityStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastActivityAt: true,
        punked: true,
      },
    });

    if (!user) {
      return null;
    }

    const isAFK = user.lastActivityAt
      ? await isUserAFK(userId)
      : false;

    return {
      isAFK,
      isPunked: user.punked,
      lastActivityAt: user.lastActivityAt,
    };
  } catch (error) {
    console.error('Failed to get activity status:', error);
    return null;
  }
}