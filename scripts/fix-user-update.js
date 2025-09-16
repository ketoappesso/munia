const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserUpdate() {
  try {
    console.log('Testing user update for keto...');

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: '18874748888'
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.id, user.username);

    // Try a simple update
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: 'Testing bio update - ' + new Date().toISOString()
      },
      select: {
        id: true,
        username: true,
        bio: true
      }
    });

    console.log('Update successful:', updated);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserUpdate();