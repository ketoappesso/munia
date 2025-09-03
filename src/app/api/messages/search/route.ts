import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Search for messages in conversations where the user is a participant
    const messages = await prisma.message.findMany({
      where: {
        AND: [
          {
            content: {
              contains: query,
              // Note: SQLite doesn't support 'mode: insensitive' - it's case-insensitive by default
            },
          },
          {
            conversation: {
              OR: [
                { participant1Id: user.id },
                { participant2Id: user.id },
              ],
            },
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
          },
        },
        conversation: {
          include: {
            participant1: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePhoto: true,
              },
            },
            participant2: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit results to prevent performance issues
    });

    // Transform the results to include the other user info
    const transformedMessages = messages.map((message) => {
      const otherUser = message.conversation.participant1Id === user.id 
        ? message.conversation.participant2 
        : message.conversation.participant1;

      return {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
        conversation: {
          id: message.conversation.id,
          otherUser,
        },
      };
    });

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json({ error: 'Failed to search messages' }, { status: 500 });
  }
}