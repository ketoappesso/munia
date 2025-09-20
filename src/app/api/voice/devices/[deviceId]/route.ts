import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

interface Params {
  params: {
    deviceId: string;
  };
}

// GET /api/voice/devices/[deviceId] - Get a specific device
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const device = await prisma.voiceDevice.findFirst({
      where: {
        id: params.deviceId,
        userId: session.user.id
      },
      include: {
        sessions: {
          take: 5,
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error('Error fetching voice device:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice device' },
      { status: 500 }
    );
  }
}

// PUT /api/voice/devices/[deviceId] - Update device
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, status } = body;

    // Verify ownership
    const device = await prisma.voiceDevice.findFirst({
      where: {
        id: params.deviceId,
        userId: session.user.id
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const updatedDevice = await prisma.voiceDevice.update({
      where: {
        id: params.deviceId
      },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        lastLogin: status === 'online' ? new Date() : undefined
      }
    });

    return NextResponse.json({ device: updatedDevice });
  } catch (error) {
    console.error('Error updating voice device:', error);
    return NextResponse.json(
      { error: 'Failed to update voice device' },
      { status: 500 }
    );
  }
}

// DELETE /api/voice/devices/[deviceId] - Delete device
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const device = await prisma.voiceDevice.findFirst({
      where: {
        id: params.deviceId,
        userId: session.user.id
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Delete device (sessions will be cascade deleted)
    await prisma.voiceDevice.delete({
      where: {
        id: params.deviceId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice device:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice device' },
      { status: 500 }
    );
  }
}