import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { megaTTSClient } from '@/lib/volcengine/megatts-client';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get speaker ID from user or query params
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone');
    
    // First try to get speaker ID from database
    const user = await prisma.user.findUnique({
      where: phoneNumber ? { phoneNumber } : { id: session.user.id },
      select: { 
        id: true,
        phoneNumber: true, 
        ttsVoiceId: true,
        punked: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the ttsVoiceId is a custom voice (starts with S_)
    const speakerId = user.ttsVoiceId?.startsWith('S_') ? user.ttsVoiceId : null;
    
    if (!speakerId) {
      // Try to get speaker ID from phone mapping
      const mappedSpeakerId = user.phoneNumber ? 
        megaTTSClient.getSpeakerIdFromPhone(user.phoneNumber) : null;
      
      if (!mappedSpeakerId) {
        return NextResponse.json({
          hasCustomVoice: false,
          message: 'No custom voice found for this user'
        });
      }
      
      // Update user's ttsVoiceId if we found a mapping
      await prisma.user.update({
        where: { id: user.id },
        data: { ttsVoiceId: mappedSpeakerId }
      });
    }

    // Fetch status from Volcengine API
    const finalSpeakerId = speakerId || megaTTSClient.getSpeakerIdFromPhone(user.phoneNumber || '');
    
    if (!finalSpeakerId) {
      return NextResponse.json({
        hasCustomVoice: false,
        message: 'No speaker ID found'
      });
    }

    // For users with custom voices (S_ prefix), return voice info
    if (finalSpeakerId.startsWith('S_')) {
      // Try to get status from MegaTTS API first
      let remainingTrainings = 8; // Default fallback
      
      try {
        const megaStatus = await megaTTSClient.checkTrainingStatus(finalSpeakerId);
        if (megaStatus.remainingTrainings !== undefined) {
          remainingTrainings = megaStatus.remainingTrainings;
        } else {
          // Fallback to database count if API doesn't return remaining trainings
          const aiProfile = await prisma.aIProfile.findFirst({
            where: { userId: user.id }
          });
          
          if (aiProfile) {
            const voiceTraining = await prisma.voiceTraining.findFirst({
              where: {
                userId: user.id,
                profileId: aiProfile.id,
                status: { in: ['pending', 'training', 'completed'] }
              }
            });
            
            if (voiceTraining && voiceTraining.sampleKeys) {
              const usedTrainings = JSON.parse(voiceTraining.sampleKeys).length;
              // Calculate remaining trainings (10 total - used)
              remainingTrainings = Math.max(0, 10 - usedTrainings);
            }
          }
        }
      } catch (error) {
        console.log('Failed to get status from MegaTTS, using database fallback');
        // Use database count as fallback
        const aiProfile = await prisma.aIProfile.findFirst({
          where: { userId: user.id }
        });
        
        if (aiProfile) {
          const voiceTraining = await prisma.voiceTraining.findFirst({
            where: {
              userId: user.id,
              profileId: aiProfile.id,
              status: { in: ['pending', 'training', 'completed'] }
            }
          });
          
          if (voiceTraining && voiceTraining.sampleKeys) {
            const usedTrainings = JSON.parse(voiceTraining.sampleKeys).length;
            remainingTrainings = Math.max(0, 10 - usedTrainings);
          }
        }
      }
      
      return NextResponse.json({
        hasCustomVoice: true,
        speakerId: finalSpeakerId,
        status: 'Active',
        stateText: '已激活',
        stateColor: 'purple',
        trainingVersion: 'V2',
        remainingTrainings,
        isActive: true,
        canTrain: remainingTrainings > 0,
        createTime: Date.now(),
        demoAudio: null,
        message: '您的专属语音模型已激活'
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