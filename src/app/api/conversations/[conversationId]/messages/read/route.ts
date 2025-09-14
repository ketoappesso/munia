import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function PATCH(request: Request, { params }: { params: { conversationId: string } }) {
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
      return NextResponse.json({ error: 'Not authorized to mark messages as read' }, { status: 403 });
    }

    // Mark all unread messages in this conversation as read
    // Only mark messages that were sent by the other user (not by the current user)
    const updateResult = await prisma.message.updateMany({
      where: {
        conversationId,
        isRead: false,
        senderId: {
          not: user.id,
        },
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      markedAsRead: updateResult.count 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
