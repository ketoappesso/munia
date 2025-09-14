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

    // Get speaker ID from user or query params
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone');

    // First try to get speaker ID from database
    const whereClause = phoneNumber
      ? { phoneNumber: phoneNumber }
      : { id: session.user.id };

    const user = await prisma.user.findUnique({
      where: whereClause,
      select: {
        id: true,
        phoneNumber: true,
        ttsVoiceId: true,
        punked: true,
        ttsRemainingTrainings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user has a voice ID configured
    const speakerId = user.ttsVoiceId;

    if (!speakerId || !speakerId.startsWith('S_')) {
      // User doesn't have a custom voice configured
      return NextResponse.json({
        hasCustomVoice: false,
        message: 'No custom voice found for this user'
      });
    }

    // For users with custom voices (S_ prefix), return voice info
    if (speakerId.startsWith('S_')) {
      // Use database for remaining trainings count
      const remainingTrainings = user.ttsRemainingTrainings ?? 5; // Default to 5 for existing users
      let trainingStatus = 'Active';
      let stateText = '已激活';

      // Still check MegaTTS for training status, but not for count
      try {
        const megaStatus = await megaTTSClient.checkTrainingStatus(speakerId);
        console.log('MegaTTS API response for status (ignoring count):', megaStatus.status);

        // Map status codes to user-friendly states
        if (megaStatus.status === 1) {
          trainingStatus = 'Training';
          stateText = '训练中';
        } else if (megaStatus.status === 2 || megaStatus.status === 4) {
          trainingStatus = 'Active';
          stateText = '已激活';
        } else if (megaStatus.status === 3) {
          trainingStatus = 'Failed';
          stateText = '训练失败';
        }
      } catch (error) {
        console.log('Failed to get status from MegaTTS, defaulting to Active:', error);
      }
      
      return NextResponse.json({
        hasCustomVoice: true,
        speakerId: speakerId,
        status: trainingStatus,
        stateText,
        stateColor: trainingStatus === 'Active' ? 'purple' : trainingStatus === 'Training' ? 'blue' : 'red',
        trainingVersion: 'V2',
        remainingTrainings,
        isActive: trainingStatus === 'Active',
        canTrain: remainingTrainings > 0,
        createTime: Date.now(),
        demoAudio: null,
        message: trainingStatus === 'Active' ?
                 `您的专属语音模型已激活，剩余训练次数：${remainingTrainings}` :
                 trainingStatus === 'Training' ? '您的语音模型正在训练中' :
                 '语音模型训练失败，请重新上传'
      });
    }
    
    // For users without custom voices
    return NextResponse.json({
      hasCustomVoice: false,
      message: '您还没有训练专属语音模型'
    });
  } catch (error) {
    console.error('Error fetching voice training status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice training status' },
      { status: 500 }
    );
  }
}