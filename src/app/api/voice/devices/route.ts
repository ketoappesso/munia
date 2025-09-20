import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

// GET /api/voice/devices - Get user's voice devices
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [devices, total] = await Promise.all([
      prisma.voiceDevice.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          lastLogin: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.voiceDevice.count({
        where: {
          userId: session.user.id
        }
      })
    ]);

    return NextResponse.json({
      devices,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching voice devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice devices' },
      { status: 500 }
    );
  }
}

// POST /api/voice/devices - Create a new voice device
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
    const { name, type = 'web', model } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Device name is required' },
        { status: 400 }
      );
    }

    // Generate unique device ID
    const deviceId = `dev_${session.user.id}_${Date.now()}`;

    const device = await prisma.voiceDevice.create({
      data: {
        id: deviceId,
        name,
        type,
        model: model || 'web-browser',
        userId: session.user.id,
        status: 'offline'
      }
    });

    return NextResponse.json({ device });
  } catch (error) {
    console.error('Error creating voice device:', error);
    return NextResponse.json(
      { error: 'Failed to create voice device' },
      { status: 500 }
    );
  }
}