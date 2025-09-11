import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { fileNameToUrl } from '@/lib/tos/fileNameToUrl';

export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: user.id }, { participant2Id: user.id }],
      },
      include: {
        participant1: {
          select: { id: true, username: true, name: true, profilePhoto: true },
        },
        participant2: {
          select: { id: true, username: true, name: true, profilePhoto: true },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            sender: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: {
                  not: user.id,
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    const transformedConversations = conversations.map((conversation) => {
      const otherUser = conversation.participant1Id === user.id ? conversation.participant2 : conversation.participant1;

      return {
        id: conversation.id,
        otherUser: {
          ...otherUser,
          profilePhoto: fileNameToUrl(otherUser.profilePhoto) || '/images/default-avatar.svg',
        },
        lastMessage: conversation.messages[0] ? {
          ...conversation.messages[0],
          sender: {
            ...conversation.messages[0].sender,
            profilePhoto: fileNameToUrl(conversation.messages[0].sender.profilePhoto) || '/images/default-avatar.svg',
          },
        } : null,
        unreadCount: conversation._count.messages,
      };
    });

    return NextResponse.json(transformedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, participantId, initialMessage } = await request.json();
    const targetId = targetUserId || participantId; // Support both parameter names

    if (!targetId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Ensure the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Ensure participants are different
    if (user.id === targetId) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
    }

    // Generate consistent conversation IDs regardless of order
    const participantIds = [user.id, targetId].sort();
    const conversationId = `${participantIds[0]}_${participantIds[1]}`;

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: user.id, participant2Id: targetId },
          { participant1Id: targetId, participant2Id: user.id },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          participant1Id: participantIds[0],
          participant2Id: participantIds[1],
          lastMessageAt: new Date(),
        },
      });
    }

    // Send initial message if provided
    if (initialMessage) {
      await prisma.message.create({
        data: {
          content: initialMessage,
          senderId: user.id,
          conversationId: conversation.id,
        },
      });

      // Update conversation's last message timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    return NextResponse.json({
      id: conversation.id,
      participant1Id: conversation.participant1Id,
      participant2Id: conversation.participant2Id,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
