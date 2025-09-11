#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestUser() {
  try {
    console.log('Setting up test user for voice training...');
    
    const phoneNumber = '18874747888';
    const hashedPassword = await bcrypt.hash('test123456', 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (existingUser) {
      console.log('User already exists, updating...');
      
      // Update user with custom voice settings
      const updatedUser = await prisma.user.update({
        where: { phoneNumber },
        data: {
          name: '语音测试用户',
          username: 'voicetest',
          passwordHash: hashedPassword,
          ttsVoiceId: 'S_r3YGBCoB1', // Custom voice ID
          punked: true,
          featured: true,
          bio: '测试语音训练功能的用户账号'
        }
      });
      
      console.log('Updated user:', {
        id: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        ttsVoiceId: updatedUser.ttsVoiceId,
        punked: updatedUser.punked
      });
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          phoneNumber,
          name: '语音测试用户',
          username: 'voicetest',
          passwordHash: hashedPassword,
          ttsVoiceId: 'S_r3YGBCoB1', // Custom voice ID
          punked: true,
          featured: true,
          bio: '测试语音训练功能的用户账号',
          email: `voicetest-${Date.now()}@test.com` // Unique email
        }
      });
      
      console.log('Created new user:', {
        id: newUser.id,
        phoneNumber: newUser.phoneNumber,
        ttsVoiceId: newUser.ttsVoiceId,
        punked: newUser.punked
      });
    }
    
    // Create or update AI profile
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (user) {
      const aiProfile = await prisma.aIProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          llmProvider: 'deepseek',
          llmModel: 'deepseek-chat',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 0.9,
          systemPrompt: '你是一个友善的AI助手，使用自定义语音进行交流。',
          roleTemplate: 'assistant'
        },
        update: {
          systemPrompt: '你是一个友善的AI助手，使用自定义语音进行交流。'
        }
      });
      
      console.log('AI Profile ready:', {
        userId: aiProfile.userId,
        provider: aiProfile.llmProvider
      });
      
      // Create a sample voice training record
      const voiceTraining = await prisma.voiceTraining.create({
        data: {
          userId: user.id,
          profileId: aiProfile.id,
          name: '语音模型 V2',
          version: 'V2',
          status: 'completed',
          progress: 100,
          sampleKeys: JSON.stringify([
            'voice-training/sample1.wav',
            'voice-training/sample2.wav'
          ]),
          sampleCount: 2,
          duration: 120,
          accuracy: 95.5,
          modelKey: 'S_r3YGBCoB1',
          trainingCompletedAt: new Date()
        }
      });
      
      console.log('Voice training record created:', {
        id: voiceTraining.id,
        status: voiceTraining.status,
        modelKey: voiceTraining.modelKey
      });
    }
    
    console.log('\n✅ Test user setup complete!');
    console.log('Login credentials:');
    console.log('  Phone: 18874747888');
    console.log('  Password: test123456');
    console.log('  Custom Voice ID: S_r3YGBCoB1');
    console.log('  Remaining trainings: 8 (as per API)');
    
  } catch (error) {
    console.error('Error setting up test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();