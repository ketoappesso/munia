#!/usr/bin/env node

import prisma from '../src/lib/prisma/prisma.js';
import bcrypt from 'bcryptjs';

async function resetKetoPassword() {
  console.log('🔐 Resetting password for keto (18874748888)...\n');

  try {
    // Find user by phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: '18874748888' },
          { username: 'keto' }
        ]
      },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        name: true,
        email: true,
        isAdmin: true,
        punked: true
      }
    });

    if (!user) {
      console.error('❌ User not found with phone number 18874748888 or username keto');
      process.exit(1);
    }

    console.log('Found user:');
    console.log('- ID:', user.id);
    console.log('- Username:', user.username);
    console.log('- Phone:', user.phoneNumber);
    console.log('- Name:', user.name);
    console.log('- Admin:', user.isAdmin ? 'Yes' : 'No');
    console.log('- Punked:', user.punked ? 'Yes' : 'No');
    console.log('');

    // Reset password to 1234567
    const newPassword = '1234567';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        // Ensure the user has proper permissions
        isAdmin: true
      }
    });

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('- Phone: 18874748888');
    console.log('- Password: 1234567');
    console.log('');
    console.log('🔑 User now has admin access');

    // Verify the password works
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hashedPassword: true }
    });

    const isValid = await bcrypt.compare(newPassword, updatedUser.hashedPassword);
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.error('❌ Password verification failed!');
    }

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetKetoPassword();