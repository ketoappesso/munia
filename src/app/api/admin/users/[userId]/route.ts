import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Admin phone number for authorization
const ADMIN_PHONE = '18874748888';

// Validation schema for update request
const UpdateUserSchema = z.object({
  phoneNumber: z.string().optional(),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  voiceId: z.string().optional(),
  remainingTrainings: z.number().min(0).optional(),
});

// PUT - Update a specific user
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('User PUT: Starting update for user', params.userId);

    const session = await auth();
    console.log('User PUT: Session data:', {
      hasSession: !!session,
      userId: session?.user?.id,
      username: session?.user?.username,
      phoneNumber: session?.user?.phoneNumber
    });

    // Check if user is authorized admin
    const isAdmin = session?.user && (
      session.user.username === ADMIN_PHONE ||
      session.user.phoneNumber === ADMIN_PHONE
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const body = await request.json();

    // Validate request body
    const validationResult = UpdateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { phoneNumber, password, name, email, voiceId, remainingTrainings } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        email: true,
        ttsVoiceId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update data object
    const updateData: any = {};

    if (phoneNumber !== undefined) {
      // Check if phone number is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Phone number already taken by another user' },
          { status: 400 }
        );
      }

      updateData.phoneNumber = phoneNumber;
      updateData.username = phoneNumber; // Update username to match
    }

    if (password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (name !== undefined) {
      updateData.name = name || null;
    }

    if (email !== undefined) {
      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          return NextResponse.json(
            { error: 'Email already taken by another user' },
            { status: 400 }
          );
        }
      }

      updateData.email = email || null;
    }

    if (voiceId !== undefined) {
      // Validate voice ID format if provided
      if (voiceId && voiceId !== '') {
        const standardVoices = ['BV001', 'BV002', 'BV003', 'BV004', 'BV005'];
        if (!voiceId.startsWith('S_') && !standardVoices.includes(voiceId)) {
          return NextResponse.json(
            { error: `Invalid voice ID format: ${voiceId}. Must start with S_ or be a standard voice (BV001-BV005)` },
            { status: 400 }
          );
        }
      }

      updateData.ttsVoiceId = voiceId || null;
      updateData.punked = voiceId ? voiceId.startsWith('S_') : false;
    }

    if (remainingTrainings !== undefined) {
      updateData.ttsRemainingTrainings = remainingTrainings;
    }

    // Update the user
    console.log('User PUT: Updating user with data:', {
      userId,
      updateData
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        name: true,
        email: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true,
        punked: true,
        walletCreatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User updated successfully`,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();

    // Check if user is authorized admin
    const isAdmin = session?.user && (
      session.user.username === ADMIN_PHONE ||
      session.user.phoneNumber === ADMIN_PHONE
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Don't allow deleting the admin user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneNumber: true,
        username: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin user
    if (user.phoneNumber === ADMIN_PHONE || user.username === ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Cannot delete admin user' },
        { status: 403 }
      );
    }

    // Delete the user (cascading delete will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}