const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('Setting up test data for Punk AI tests...');

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    const testUser = await prisma.user.upsert({
      where: { phoneNumber: '13800138000' },
      update: {},
      create: {
        phoneNumber: '13800138000',
        passwordHash: hashedPassword,
        username: 'testuser1',
        name: 'Test User',
        emailVerified: new Date(),
      },
    });
    console.log('Created test user:', testUser.username);

    // Create punk user with AI capabilities
    const punkUser = await prisma.user.upsert({
      where: { username: 'punkuser1' },
      update: {
        punked: true,
      },
      create: {
        phoneNumber: '13800138001',
        passwordHash: hashedPassword,
        username: 'punkuser1',
        name: 'AI Punk User',
        emailVerified: new Date(),
        punked: true,
        ttsVoiceId: 'BV001_streaming',
      },
    });
    console.log('Created punk user:', punkUser.username);

    // Create another punk user for testing
    const punkUser2 = await prisma.user.upsert({
      where: { username: 'punkuser2' },
      update: {
        punked: true,
      },
      create: {
        phoneNumber: '13800138002',
        passwordHash: hashedPassword,
        username: 'punkuser2',
        name: 'Another Punk',
        emailVerified: new Date(),
        punked: true,
        ttsVoiceId: 'BV002_streaming',
      },
    });
    console.log('Created punk user 2:', punkUser2.username);

    // Create a regular user for comparison
    const regularUser = await prisma.user.upsert({
      where: { username: 'regularuser1' },
      update: {},
      create: {
        phoneNumber: '13800138003',
        passwordHash: hashedPassword,
        username: 'regularuser1',
        name: 'Regular User',
        emailVerified: new Date(),
        punked: false,
      },
    });
    console.log('Created regular user:', regularUser.username);

    console.log('\nTest data setup complete!');
    console.log('You can now login with:');
    console.log('Phone: 13800138000');
    console.log('Password: testpass123');
    
  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();