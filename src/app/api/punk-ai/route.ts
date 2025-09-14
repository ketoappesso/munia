import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import punkAIService from '@/lib/llm/punk-ai-service';
import { z } from 'zod';

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1).max(1000),
  recipientId: z.string(),
});

export async function POST(request: Request) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { conversationId, message, recipientId } = validation.data;

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
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if recipient is a punk user
    const isPunk = await punkAIService.isPunkUser(recipientId);
    if (!isPunk) {
      return NextResponse.json({ 
        error: 'Recipient is not a punk user',
        isPunk: false 
      }, { status: 400 });
    }

    // Generate AI response with audio
    const aiResponse = await punkAIService.generatePunkResponse(
      conversationId,
      message,
      recipientId
    );

    // Save the user's message
    await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: message,
        type: 'TEXT',
      },
    });

    // Save the AI response
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: recipientId,
        content: aiResponse.text,
        type: 'TEXT',
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isRead: true,
        type: true,
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
            punked: true,
            ttsVoiceId: true,
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

    return NextResponse.json({
      message: aiMessage,
      audio: aiResponse.audio,
      voiceId: aiResponse.voiceId,
      cached: aiResponse.cached,
    });
  } catch (error) {
    console.error('Error in punk AI API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a user is a punk user
export async function GET() {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const isPunk = await punkAIService.isPunkUser(userId);
    
    const punkUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        punked: true,
        ttsVoiceId: true,
        name: true,
        username: true,
      },
    });

    return NextResponse.json({
      isPunk,
      user: punkUser,
    });
  } catch (error) {
    console.error('Error checking punk status:', error);
    return NextResponse.json(
      { error: 'Failed to check punk status' },
      { status: 500 }
    );
  }
}