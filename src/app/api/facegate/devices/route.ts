import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

const ADMIN_PHONE = '18874748888';

export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin for full device list
    // Using username since phoneNumber is not in session
    const isAdmin = user.username === ADMIN_PHONE || user.phoneNumber === ADMIN_PHONE;

    if (!isAdmin) {
      // Regular users can only see their assigned devices (future feature)
      return NextResponse.json({ items: [] });
    }

    const devices = await prisma.facegateDevice.findMany({
      orderBy: { lastSeenTs: 'desc' }
    });

    // Calculate online status (within last 2 minutes)
    const now = Math.floor(Date.now() / 1000);
    const items = devices.map(device => ({
      ...device,
      online: device.lastSeenTs ? (now - Number(device.lastSeenTs)) < 120 : false,
      lastSeenTs: device.lastSeenTs?.toString() // Convert BigInt to string for JSON
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// POST - Add new device
export async function POST(request: NextRequest) {
  try {
    const [user] = await getServerUser();
    if (!user || (user.username !== ADMIN_PHONE && user.phoneNumber !== ADMIN_PHONE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, deviceName, location } = body;

    if (!deviceId || !deviceName) {
      return NextResponse.json(
        { error: 'Device ID and name are required' },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existing = await prisma.facegateDevice.findUnique({
      where: { deviceId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Device with this ID already exists' },
        { status: 400 }
      );
    }

    // Create new device
    const device = await prisma.facegateDevice.create({
      data: {
        deviceId,
        deviceName,
        location,
        online: false
      }
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    );
  }
}