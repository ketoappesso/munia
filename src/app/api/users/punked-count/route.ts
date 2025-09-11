import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET() {
  try {
    const punkedCount = await prisma.user.count({
      where: {
        punked: true,
      },
    });

    return NextResponse.json({ count: punkedCount });
  } catch (error) {
    console.error('Error fetching punked users count:', error);
    return NextResponse.json({ error: 'Failed to fetch punked users count' }, { status: 500 });
  }
}