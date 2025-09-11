import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

// Schema for validating AI profile updates
const AIProfileSchema = z.object({
  llmProvider: z.enum(['openai', 'deepseek', 'claude', 'custom']).optional(),
  llmModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
  topP: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().optional(),
  roleTemplate: z.string().optional(),
  contextPrompts: z.record(z.string()).optional(),
  activeVoiceId: z.string().nullable().optional(),
});

// GET /api/ai/profile - Get user's AI profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.aIProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        voiceTrainings: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // If no profile exists, return default values
    if (!profile) {
      return NextResponse.json({
        llmProvider: 'deepseek',
        llmModel: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        systemPrompt: null,
        roleTemplate: 'assistant',
        contextPrompts: {},
        activeVoiceId: null,
        voiceTrainings: [],
      });
    }

    // Parse contextPrompts from JSON string
    const contextPrompts = profile.contextPrompts 
      ? JSON.parse(profile.contextPrompts) 
      : {};

    return NextResponse.json({
      ...profile,
      contextPrompts,
    });
  } catch (error) {
    console.error('Error fetching AI profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/ai/profile - Update user's AI profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AIProfileSchema.parse(body);

    // Convert contextPrompts to JSON string if provided
    const dataToUpdate: any = { ...validatedData };
    if (validatedData.contextPrompts) {
      dataToUpdate.contextPrompts = JSON.stringify(validatedData.contextPrompts);
    }

    // Upsert the AI profile
    const profile = await prisma.aIProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...dataToUpdate,
      },
      update: dataToUpdate,
      include: {
        voiceTrainings: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Parse contextPrompts back to object for response
    const responseProfile = {
      ...profile,
      contextPrompts: profile.contextPrompts 
        ? JSON.parse(profile.contextPrompts)
        : {},
    };

    return NextResponse.json(responseProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating AI profile:', error);
    return NextResponse.json(
      { error: 'Failed to update AI profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/profile - Delete user's AI profile
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.aIProfile.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI profile' },
      { status: 500 }
    );
  }
}