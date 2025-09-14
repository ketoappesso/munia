import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

const ADMIN_PHONE = '18874748888';

export async function GET(request: Request) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === '1';
    // Check admin using username since phoneNumber is not in session
    const isAdmin = user.username === ADMIN_PHONE || user.phoneNumber === ADMIN_PHONE;

    // If 'all' is requested, only admin can see all schedules
    if (all && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where = all ? {} : { userPhone: user.phoneNumber || user.id };

    const schedules = await prisma.facegateSchedule.findMany({
      where,
      include: {
        targets: {
          select: { deviceId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const items = schedules.map(schedule => ({
      ...schedule,
      targets: schedule.targets.map(t => t.deviceId)
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image_id, start_at, end_at, cron, targets = [], payload_type } = body;

    const userPhone = user.phoneNumber || user.id;

    if (!start_at) {
      return NextResponse.json({ error: 'start_at required' }, { status: 400 });
    }

    if (!image_id && payload_type !== 'face') {
      return NextResponse.json({ error: 'image_id required for image payload' }, { status: 400 });
    }

    // Create schedule
    const schedule = await prisma.facegateSchedule.create({
      data: {
        userPhone,
        imageId: image_id || null,
        payloadType: payload_type || 'image',
        startAt: new Date(start_at),
        endAt: end_at ? new Date(end_at) : null,
        cron: cron || null,
        status: 0
      }
    });

    // Create targets
    if (Array.isArray(targets) && targets.length > 0) {
      await prisma.facegateScheduleTarget.createMany({
        data: targets.map(deviceId => ({
          scheduleId: schedule.id,
          deviceId
        }))
      });
    }

    return NextResponse.json({ id: schedule.id });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}