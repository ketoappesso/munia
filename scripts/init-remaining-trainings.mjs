#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initRemainingTrainings() {
  try {
    console.log('Initializing remaining trainings for all users with custom voices...');

    // Find all users with custom voices (S_ prefix)
    const usersWithCustomVoices = await prisma.user.findMany({
      where: {
        ttsVoiceId: {
          startsWith: 'S_'
        }
      },
      select: {
        id: true,
        phoneNumber: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true
      }
    });

    console.log(`Found ${usersWithCustomVoices.length} users with custom voices`);

    // Update each user to have 5 remaining trainings if not already set
    let updatedCount = 0;
    for (const user of usersWithCustomVoices) {
      if (user.ttsRemainingTrainings === null || user.ttsRemainingTrainings === undefined) {
        await prisma.user.update({
          where: { id: user.id },
          data: { ttsRemainingTrainings: 5 }
        });
        console.log(`✓ Updated user ${user.phoneNumber || user.id}: set remaining trainings to 5`);
        updatedCount++;
      } else {
        console.log(`- User ${user.phoneNumber || user.id} already has ${user.ttsRemainingTrainings} remaining trainings`);
      }
    }

    console.log(`\nInitialization complete! Updated ${updatedCount} users.`);

    // Show current status
    const updatedUsers = await prisma.user.findMany({
      where: {
        ttsVoiceId: {
          startsWith: 'S_'
        }
      },
      select: {
        phoneNumber: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true
      }
    });

    console.log('\nCurrent status:');
    for (const user of updatedUsers) {
      console.log(`  ${user.phoneNumber || 'Unknown'}: ${user.ttsRemainingTrainings} remaining trainings`);
    }

  } catch (error) {
    console.error('Error initializing remaining trainings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initRemainingTrainings();