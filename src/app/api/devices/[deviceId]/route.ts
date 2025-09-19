import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import prisma from '@/lib/prisma/prisma';

interface Params {
  params: {
    deviceId: string;
  };
}

// GET /api/devices/[deviceId] - Get a specific device
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

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
    console.error('Error fetching device:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device' },
      { status: 500 }
    );
  }
}

// PUT /api/devices/[deviceId] - Update a device
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, status, roleId, functionNames } = body;

    // Check device ownership
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
        ...(type && { type }),
        ...(status && { status }),
        ...(roleId !== undefined && { roleId }),
        ...(functionNames !== undefined && { functionNames }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ device: updatedDevice });
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/[deviceId] - Delete a device
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check device ownership
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

    // Delete device and all related data (cascading delete)
    await prisma.voiceDevice.delete({
      where: {
        id: params.deviceId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    );
  }
}