import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

const updateVoiceSchema = z.object({
  voiceId: z.string().min(1),
});

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateVoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid voice ID' },
        { status: 400 }
      );
    }

    const { voiceId } = validation.data;

    // Update user's voice preference
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { ttsVoiceId: voiceId },
      select: {
        id: true,
        ttsVoiceId: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating voice preference:', error);
    return NextResponse.json(
      { error: 'Failed to update voice preference' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        ttsVoiceId: true,
        phoneNumber: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching voice preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice preference' },
      { status: 500 }
    );
  }
}