#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminUser() {
  try {
    const adminPhone = '18874748888';
    const adminPassword = 'Test123456!';

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: adminPhone }
    });

    if (existingUser) {
      console.log('Admin user already exists');

      // Update password just in case
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash: hashedPassword,
          phoneNumber: adminPhone,
          punked: true,
          ttsVoiceId: 'S_r3YGBCoB1', // Give admin a custom voice
          ttsRemainingTrainings: 5
        }
      });

      console.log('Admin user updated');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await prisma.user.create({
        data: {
          username: adminPhone,
          phoneNumber: adminPhone,
          passwordHash: hashedPassword,
          name: 'Super Admin',
          punked: true,
          ttsVoiceId: 'S_r3YGBCoB1',
          ttsRemainingTrainings: 5,
          profileSetup: true
        }
      });

      console.log('Admin user created:', adminUser.id);
    }

    // Create a few test users with various voice configurations
    const testUsers = [
      {
        username: '13800138001',
        phoneNumber: '13800138001',
        name: 'Test User 1',
        ttsVoiceId: 'S_test001',
        punked: true,
        ttsRemainingTrainings: 3
      },
      {
        username: '13800138002',
        phoneNumber: '13800138002',
        name: 'Test User 2',
        ttsVoiceId: 'BV001',
        punked: false,
        ttsRemainingTrainings: 5
      },
      {
        username: '13800138003',
        phoneNumber: '13800138003',
        name: 'Test User 3',
        ttsVoiceId: null,
        punked: false,
        ttsRemainingTrainings: 5
      }
    ];

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash('Test123456!', 10);
        await prisma.user.create({
          data: {
            ...userData,
            passwordHash: hashedPassword,
            profileSetup: true
          }
        });
        console.log(`Created test user: ${userData.username}`);
      } else {
        console.log(`Test user ${userData.username} already exists`);
      }
    }

    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Error setting up admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminUser();