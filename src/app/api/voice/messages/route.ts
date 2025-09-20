import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

// POST /api/voice/messages - Create a voice message
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, content, role, type, audioUrl } = body;

    if (!sessionId || !content || !role || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify session ownership
    const voiceSession = await prisma.voiceSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id
      }
    });

    if (!voiceSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = await prisma.voiceMessage.create({
      data: {
        id: messageId,
        sessionId,
        content,
        role,
        type,
        audioUrl: audioUrl || null
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating voice message:', error);
    return NextResponse.json(
      { error: 'Failed to create voice message' },
      { status: 500 }
    );
  }
}