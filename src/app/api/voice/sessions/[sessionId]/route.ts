import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import prisma from '@/lib/prisma/prisma';

interface Params {
  params: {
    sessionId: string;
  };
}

// GET /api/voice/sessions/[sessionId] - Get a specific session with messages
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const voiceSession = await prisma.voiceSession.findFirst({
      where: {
        id: params.sessionId,
        userId: session.user.id
      },
      include: {
        device: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!voiceSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: voiceSession });
  } catch (error) {
    console.error('Error fetching voice session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice session' },
      { status: 500 }
    );
  }
}

// PUT /api/voice/sessions/[sessionId] - End a voice session
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session ownership
    const voiceSession = await prisma.voiceSession.findFirst({
      where: {
        id: params.sessionId,
        userId: session.user.id
      }
    });

    if (!voiceSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // End the session
    const updatedSession = await prisma.voiceSession.update({
      where: {
        id: params.sessionId
      },
      data: {
        endTime: new Date()
      }
    });

    // Update device status to offline
    await prisma.voiceDevice.update({
      where: {
        id: voiceSession.deviceId
      },
      data: {
        status: 'offline'
      }
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error ending voice session:', error);
    return NextResponse.json(
      { error: 'Failed to end voice session' },
      { status: 500 }
    );
  }
}

// DELETE /api/voice/sessions/[sessionId] - Delete a voice session and its messages
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session ownership
    const voiceSession = await prisma.voiceSession.findFirst({
      where: {
        id: params.sessionId,
        userId: session.user.id
      }
    });

    if (!voiceSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete session (messages will be cascade deleted)
    await prisma.voiceSession.delete({
      where: {
        id: params.sessionId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice session:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice session' },
      { status: 500 }
    );
  }
}