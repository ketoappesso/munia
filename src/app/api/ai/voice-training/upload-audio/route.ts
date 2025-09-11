import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { nanoid } from 'nanoid';
import { megaTTSClient, ModelType, Language } from '@/lib/volcengine/megatts-client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;
    const modelType = formData.get('modelType') as string || '1'; // Default to V2_ICL
    const language = formData.get('language') as string || '0'; // Default to Chinese
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const validFormats = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validFormats.some(format => file.type.startsWith(format))) {
      return NextResponse.json({ 
        error: 'Invalid file format. Supported formats: WAV, MP3, OGG, M4A, AAC' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB per MegaTTS requirements)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        phoneNumber: true,
        ttsVoiceId: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or generate speaker ID
    let speakerId = user.ttsVoiceId;
    if (!speakerId || !speakerId.startsWith('S_')) {
      // Generate a new speaker ID for this user
      speakerId = `S_${user.id.substring(0, 8)}_${nanoid(6)}`;
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension and format
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'wav';
    let audioFormat = fileExtension;
    // Normalize format names for MegaTTS API
    if (audioFormat === 'mp3') audioFormat = 'mp3';
    else if (audioFormat === 'wav') audioFormat = 'wav';
    else if (audioFormat === 'm4a') audioFormat = 'm4a';
    else if (audioFormat === 'aac') audioFormat = 'aac';
    else if (audioFormat === 'ogg') audioFormat = 'ogg';
    
    // Upload directly to MegaTTS for training
    console.log('Uploading to MegaTTS with params:', {
      speakerId,
      audioFormat,
      modelType: parseInt(modelType),
      language: parseInt(language),
      hasText: !!text
    });
    
    const uploadResult = await megaTTSClient.uploadTrainingAudio(
      speakerId,
      buffer,
      audioFormat,
      text,
      parseInt(modelType) as ModelType,
      parseInt(language) as Language
    );

    if (uploadResult.success && uploadResult.speakerId) {
      // Update user's voice ID if new
      if (user.ttsVoiceId !== uploadResult.speakerId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { ttsVoiceId: uploadResult.speakerId }
        });
      }
      speakerId = uploadResult.speakerId || speakerId;

      // Save training record in database (for tracking)
      const aiProfile = await prisma.aIProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          llmProvider: 'deepseek',
          llmModel: 'deepseek-chat'
        },
        update: {}
      });

      // Generate a filename for record keeping
      const timestamp = Date.now();
      const uniqueId = nanoid();
      const fileName = `voice-training/${user.id}/${timestamp}-${uniqueId}.${fileExtension}`;
      
      // Get existing training record or create new one
      let voiceTraining = await prisma.voiceTraining.findFirst({
        where: {
          userId: user.id,
          profileId: aiProfile.id,
          status: { in: ['pending', 'training', 'completed'] }
        }
      });

      // Check upload limit (10 uploads per speaker ID)
      const existingCount = voiceTraining ? JSON.parse(voiceTraining.sampleKeys).length : 0;
      if (existingCount >= 10) {
        return NextResponse.json({ 
          error: '已达到训练次数上限（10次）',
          code: 1123 
        }, { status: 400 });
      }

      if (!voiceTraining) {
        voiceTraining = await prisma.voiceTraining.create({
          data: {
            userId: user.id,
            profileId: aiProfile.id,
            name: `语音模型 ${new Date().toLocaleDateString()}`,
            version: modelType === '3' ? 'DiT' : modelType === '2' ? 'DiT_Standard' : modelType === '1' ? 'V2_ICL' : 'V1',
            status: 'completed', // MegaTTS is instant training
            sampleKeys: JSON.stringify([fileName]),
            sampleCount: 1,
            duration: 5, // Minimum 5 seconds for quick training
          }
        });
      } else {
        // Update existing training record
        const existingKeys = JSON.parse(voiceTraining.sampleKeys);
        existingKeys.push(fileName);
        
        await prisma.voiceTraining.update({
          where: { id: voiceTraining.id },
          data: {
            sampleKeys: JSON.stringify(existingKeys),
            sampleCount: existingKeys.length,
            status: 'completed', // MegaTTS completes instantly
            version: modelType === '3' ? 'DiT' : modelType === '2' ? 'DiT_Standard' : modelType === '1' ? 'V2_ICL' : 'V1'
          }
        });
      }

      // Get training status from MegaTTS
      let trainingStatus = 'completed'; // MegaTTS is instant
      try {
        const status = await megaTTSClient.getVoiceStatus(speakerId);
        if (status.status === 2 || status.status === 4) {
          trainingStatus = 'completed';
        }
      } catch (statusError) {
        console.error('Failed to get MegaTTS status:', statusError);
      }

      return NextResponse.json({
        success: true,
        speakerId: speakerId,
        trainingId: voiceTraining.id,
        sampleCount: JSON.parse(voiceTraining.sampleKeys).length,
        fileName,
        status: trainingStatus,
        message: '音频上传成功，模型已训练完成！'
      });
    } else {
      // Upload failed
      console.error('MegaTTS upload failed:', uploadResult.error);
      
      // Return specific error message
      if (uploadResult.statusCode === 1123) {
        return NextResponse.json({ 
          error: uploadResult.error || '已达到训练次数上限（10次）',
          code: 1123
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: uploadResult.error || 'Failed to upload audio to voice training service',
        code: uploadResult.statusCode
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error uploading training audio:', error);
    return NextResponse.json(
      { error: 'Failed to upload training audio' },
      { status: 500 }
    );
  }
}