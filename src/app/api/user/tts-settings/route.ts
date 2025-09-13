import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
  playbackSpeed: z.number().min(0.5).max(2.0).optional(),
  voiceId: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { playbackSpeed, voiceId } = validation.data;

    // Update user settings
    const updateData: any = {};

    if (playbackSpeed !== undefined) {
      updateData.ttsPlaybackSpeed = playbackSpeed;
    }

    if (voiceId !== undefined) {
      updateData.ttsVoiceId = voiceId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        ttsPlaybackSpeed: true,
        ttsVoiceId: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating TTS settings:', error);
    return NextResponse.json(
      { error: 'Failed to update TTS settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
        ttsPlaybackSpeed: true,
        ttsVoiceId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      playbackSpeed: user.ttsPlaybackSpeed || 1.0,
      voiceId: user.ttsVoiceId || null,
    });

  } catch (error) {
    console.error('Error fetching TTS settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TTS settings' },
      { status: 500 }
    );
  }
}