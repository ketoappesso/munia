import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { megaTTSClient } from '@/lib/volcengine/megatts-client';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's speaker ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ttsVoiceId: true }
    });

    if (!user?.ttsVoiceId || !user.ttsVoiceId.startsWith('S_')) {
      return NextResponse.json({
        error: 'No custom voice found',
        ttsVoiceId: user?.ttsVoiceId
      }, { status: 404 });
    }

    // Get real-time status from MegaTTS
    const megaStatus = await megaTTSClient.checkTrainingStatus(user.ttsVoiceId);

    // Also get voice status using the other method
    const voiceStatus = await megaTTSClient.getVoiceStatus(user.ttsVoiceId);

    return NextResponse.json({
      speakerId: user.ttsVoiceId,
      megaTTSStatus: megaStatus,
      voiceStatus: voiceStatus,
      debug: {
        message: 'This is the raw response from Volcengine MegaTTS API',
        remainingTrainings: megaStatus.remainingTrainings,
        isFromAPI: true
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}