import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { nanoid } from 'nanoid';
import { megaTTSClient, ModelType, Language } from '@/lib/volcengine/megatts-client';

export async function POST(request: Request) {
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

    // Get user info including remaining trainings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        phoneNumber: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check remaining trainings
    const remainingTrainings = user.ttsRemainingTrainings ?? 5; // Default to 5 for existing users
    if (remainingTrainings <= 0) {
      return NextResponse.json({
        error: '您的训练次数已用完',
        remainingTrainings: 0
      }, { status: 400 });
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
      // Only decrease training count on successful upload (StatusCode === 0)
      // Update user's voice ID and decrease remaining trainings
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ttsVoiceId: uploadResult.speakerId,
          ttsRemainingTrainings: remainingTrainings - 1
        }
      });
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

      // Get the updated remaining trainings from database
      const updatedRemainingTrainings = remainingTrainings - 1;

      return NextResponse.json({
        success: true,
        speakerId: speakerId,
        trainingId: voiceTraining.id,
        sampleCount: JSON.parse(voiceTraining.sampleKeys).length,
        remainingTrainings: updatedRemainingTrainings,
        fileName,
        status: 'completed',
        message: `音频上传成功！剩余训练次数：${updatedRemainingTrainings}`
      });
    } else {
      // Upload failed - DO NOT decrease training count
      console.error('MegaTTS upload failed:', uploadResult.error, 'StatusCode:', uploadResult.statusCode);

      // Map specific error codes to user-friendly messages
      const errorMessages: Record<number, string> = {
        1001: '请求参数有误，请重新上传',
        1101: '音频上传失败，请重试',
        1102: '语音识别失败，请确保音频清晰',
        1103: '声纹检测失败，请重新录制',
        1104: '声纹与名人相似度过高，请使用您自己的声音',
        1105: '获取音频数据失败，请重试',
        1106: '音色ID重复，请刷新页面重试',
        1107: '音色ID未找到，请刷新页面重试',
        1108: '音频转码失败，请检查音频格式',
        1109: '音频与文本不匹配，请重新录制',
        1111: '未检测到说话声，请重新录制',
        1112: '音频噪音过大，请在安静环境录制',
        1113: '降噪处理失败，请重新录制',
        1114: '音频质量过低，请在安静环境重新录制',
        1122: '未检测到人声，请对着麦克风说话',
        1123: '已达到训练次数上限（每个音色最多10次）'
      };

      const statusCode = uploadResult.statusCode || 500;
      const errorMessage = errorMessages[statusCode] || uploadResult.error || '上传失败，请重试';

      // DO NOT decrease remainingTrainings on failure
      return NextResponse.json({
        error: errorMessage,
        code: statusCode,
        remainingTrainings: remainingTrainings, // Keep the same count
        message: `上传失败：${errorMessage}。剩余训练次数：${remainingTrainings}（未扣除）`
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error uploading training audio:', error);
    return NextResponse.json(
      { error: 'Failed to upload training audio' },
      { status: 500 }
    );
  }
}