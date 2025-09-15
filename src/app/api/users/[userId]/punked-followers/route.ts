import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get all followers of this user who have punked status
    const punkedFollowers = await prisma.follow.findMany({
      where: {
        followedId: userId,
        follower: {
          punked: true
        }
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            avatarUrl: true,
            punked: true,
            ttsVoiceId: true,
          }
        }
      }
    });

    // Extract the follower data
    const followers = punkedFollowers.map(f => f.follower);

    return NextResponse.json({
      count: followers.length,
      users: followers
    });

  } catch (error) {
    console.error('Error fetching punked followers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch punked followers' },
      { status: 500 }
    );
  }
}