import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import prisma from '@/lib/prisma/prisma';

// GET /api/devices - Get all devices for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const devices = await prisma.voiceDevice.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// POST /api/devices - Create a new device
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
    const { deviceId, name, type } = body;

    if (!deviceId || !name) {
      return NextResponse.json(
        { error: 'Device ID and name are required' },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existingDevice = await prisma.voiceDevice.findUnique({
      where: { id: deviceId }
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device already exists' },
        { status: 409 }
      );
    }

    const device = await prisma.voiceDevice.create({
      data: {
        id: deviceId,
        name,
        type: type || 'web',
        userId: session.user.id,
        status: 'offline'
      }
    });

    return NextResponse.json({ device });
  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    );
  }
}