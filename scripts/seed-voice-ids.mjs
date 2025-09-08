import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVoiceIds() {
  try {
    console.log('Starting voice ID seeding...');

    // Update user with phone number 18874748888 to have custom voice
    const user1 = await prisma.user.updateMany({
      where: {
        phoneNumber: '18874748888',
      },
      data: {
        ttsVoiceId: 'S_r3YGBCoB1',
        featured: true,
      },
    });

    if (user1.count > 0) {
      console.log(`✅ Updated user with phone 18874748888 with custom voice S_r3YGBCoB1`);
    }

    // Set default voices for some other users for testing
    const defaultVoices = [
      'BV001_streaming',
      'BV002_streaming',
      'BV003_streaming',
      'BV004_streaming',
      'BV005_streaming',
    ];

    // Get random users without voice IDs
    const usersWithoutVoice = await prisma.user.findMany({
      where: {
        ttsVoiceId: null,
        phoneNumber: {
          not: '18874748888',
        },
      },
      take: 10,
    });

    // Assign random default voices to these users
    for (let i = 0; i < usersWithoutVoice.length; i++) {
      const user = usersWithoutVoice[i];
      const voiceId = defaultVoices[i % defaultVoices.length];
      
      await prisma.user.update({
        where: { id: user.id },
        data: { ttsVoiceId: voiceId },
      });

      console.log(`✅ Assigned voice ${voiceId} to user ${user.username || user.name}`);
    }

    console.log('\n✨ Voice ID seeding completed successfully!');
    console.log('Users can now select from BV001-BV005 voices in settings.');
    console.log('User with phone 18874748888 has custom voice S_r3YGBCoB1.');

  } catch (error) {
    console.error('Error seeding voice IDs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedVoiceIds();