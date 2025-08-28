/**
 * Test data setup for messaging scenarios
 * Runner: node tests/setup-test-data.ts
 */
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestUsers() {
  console.log('Setting up test users for messaging...');

  const testUsersData = [
    {
      username: 'testuser1',
      email: 'testuser1@example.com',
      name: 'Test User 1',
      phoneNumber: '+8613800138001',
      password: 'Test@Pass123',
      bio: 'Messaging test user 1',
      profilePhoto: 'https://via.placeholder.com/150x150.png',
    },
    {
      username: 'testuser2',
      email: 'testuser2@example.com',
      name: 'Test User 2',
      phoneNumber: '+8613800138002',
      password: 'Test@Pass123',
      bio: 'Messaging test user 2',
      profilePhoto: 'https://via.placeholder.com/150x150.png',
    },
    {
      username: 'testuser3',
      email: 'testuser3@example.com',
      name: 'Test User 3',
      phoneNumber: '+8613800138003',
      password: 'Test@Pass123',
      bio: 'Messaging test user 3',
      profilePhoto: 'https://via.placeholder.com/150x150.png',
    },
    {
      username: 'testuser4',
      email: 'testuser4@example.com',
      name: 'Test User 4',
      phoneNumber: '+8613800138004',
      password: 'Test@Pass123',
      bio: 'Messaging test user 4',
      profilePhoto: 'https://via.placeholder.com/150x150.png',
    },
    {
      username: 'testuser5',
      email: 'testuser5@example.com',
      name: 'Test User 5',
      phoneNumber: '+8613800138005',
      password: 'Test@Pass123',
      bio: 'Messaging test user 5',
      profilePhoto: 'https://via.placeholder.com/150x150.png',
    },
  ];

  for (const userData of testUsersData) {
    const existingUser = await prisma.user.findFirst({
      where: { username: userData.username }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          passwordHash: hashedPassword,
          bio: userData.bio,
          profilePhoto: userData.profilePhoto,
          emailVerified: new Date(),
        }
      });
    }
  }

  console.log('✅ Test users created successfully');
}

async function setupTestConversations() {
  console.log('Setting up test conversations...');

  const testuser1 = await prisma.user.findUnique({ where: { username: 'testuser1' } });
  const testuser2 = await prisma.user.findUnique({ where: { username: 'testuser2' } });

  if (testuser1 && testuser2) {
    const conversationId = `${[testuser1.id, testuser2.id].sort().join('_')}`;
    
    // Create conversation between testuser1 and testuser2
    const conversation = await prisma.conversation.upsert({
      where: { id: conversationId },
      update: {},
      create: {
        id: conversationId,
        participant1Id: testuser1.id,
        participant2Id: testuser2.id,
        lastMessageAt: new Date(),
      }
    });

    // Add sample messages
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: testuser1.id,
        content: 'Hello Test User 2!',
        isRead: false,
      }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: testuser2.id,
        content: 'Hi Test User 1! How are you?',
        isRead: false,
      }
    });

    console.log('✅ Test conversation created between testuser1 and testuser2');
  }
}

async function main() {
  try {
    await setupTestUsers();
    await setupTestConversations();
    console.log('🎉 Test data setup complete!');
  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { setupTestUsers, setupTestConversations };