import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

// Admin phone number
const ADMIN_PHONE = '18874748888';

// PUT - Update device
export async function PUT(request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [user] = await getServerUser();
    if (!user || user.phoneNumber !== ADMIN_PHONE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceName, location } = body;

    const device = await prisma.facegateDevice.update({
      where: { id: params.id },
      data: {
        deviceName,
        location,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

// DELETE - Delete device
export async function DELETE(request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [user] = await getServerUser();
    if (!user || user.phoneNumber !== ADMIN_PHONE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.facegateDevice.delete({
      where: { id: params.id }
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