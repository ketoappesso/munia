import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant2Id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.participant1Id !== user.id && conversation.participant2Id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to view this conversation' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant2Id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.participant1Id !== user.id && conversation.participant2Id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to send messages in this conversation' }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
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
    });

    // Update conversation's last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
