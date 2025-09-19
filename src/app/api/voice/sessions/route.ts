import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import prisma from '@/lib/prisma/prisma';

// GET /api/voice/sessions - Get voice sessions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = {
      userId: session.user.id,
      ...(deviceId && { deviceId })
    };

    const [sessions, total] = await Promise.all([
      prisma.voiceSession.findMany({
        where,
        include: {
          device: true,
          messages: {
            take: 3,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.voiceSession.count({ where })
    ]);

    return NextResponse.json({
      sessions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching voice sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice sessions' },
      { status: 500 }
    );
  }
}

// POST /api/voice/sessions - Start a new voice session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Verify device ownership
    const device = await prisma.voiceDevice.findFirst({
      where: {
        id: deviceId,
        userId: session.user.id
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // End any existing active sessions for this device
    await prisma.voiceSession.updateMany({
      where: {
        deviceId,
        endTime: null
      },
      data: {
        endTime: new Date()
      }
    });

    // Create new session
    const voiceSession = await prisma.voiceSession.create({
      data: {
        deviceId,
        userId: session.user.id,
        startTime: new Date()
      },
      include: {
        device: true
      }
    });

    // Update device status to online
    await prisma.voiceDevice.update({
      where: {
        id: deviceId
      },
      data: {
        status: 'online',
        lastLogin: new Date()
      }
    });

    return NextResponse.json({ session: voiceSession });
  } catch (error) {
    console.error('Error creating voice session:', error);
    return NextResponse.json(
      { error: 'Failed to create voice session' },
      { status: 500 }
    );
  }
}