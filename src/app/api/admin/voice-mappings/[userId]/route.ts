import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

// Validation schema for update request
const UpdateVoiceMappingSchema = z.object({
  voiceId: z.string().optional(),
  remainingTrainings: z.number().min(0).optional(),
});

// Admin phone number for authorization
const ADMIN_PHONE = '18874748888';

// Update a specific user's voice mapping
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('Voice mapping PUT: Starting update for user', params.userId);

    const session = await auth();
    console.log('Voice mapping PUT: Session data:', {
      hasSession: !!session,
      userId: session?.user?.id,
      username: session?.user?.username,
      phoneNumber: session?.user?.phoneNumber
    });

    // Check if user is authorized admin - check both username and phoneNumber
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
    const validationResult = UpdateVoiceMappingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { voiceId, remainingTrainings } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        ttsVoiceId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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

    // Update the user's voice mapping
    console.log('Voice mapping PUT: Updating user with data:', {
      userId,
      voiceId: voiceId || null,
      punked: voiceId ? voiceId.startsWith('S_') : false,
      remainingTrainings
    });

    // Build update data object
    const updateData: any = {};

    if (voiceId !== undefined) {
      updateData.ttsVoiceId = voiceId || null;
      updateData.punked = voiceId ? voiceId.startsWith('S_') : false;
    }

    if (remainingTrainings !== undefined) {
      updateData.ttsRemainingTrainings = remainingTrainings;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        name: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true,
        punked: true,
        walletCreatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Voice mapping updated for user ${user.name || user.phoneNumber}`,
    });
  } catch (error) {
    console.error('Error updating voice mapping:', error);
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

// Delete a user's voice mapping (reset to null)
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();

    // Check if user is authorized admin - check both username and phoneNumber
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        ttsVoiceId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Clear the user's voice mapping
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ttsVoiceId: null,
        punked: false,
        ttsRemainingTrainings: 5, // Reset to default
      },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        name: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true,
        punked: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Voice mapping cleared for user ${user.name || user.phoneNumber}`,
    });
  } catch (error) {
    console.error('Error deleting voice mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}