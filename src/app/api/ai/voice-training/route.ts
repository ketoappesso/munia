import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

// Schema for creating voice training
const VoiceTrainingCreateSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
  sampleKeys: z.array(z.string()).min(1),
  sampleCount: z.number().min(1),
  duration: z.number().min(0),
});

// Schema for updating voice training status
const VoiceTrainingUpdateSchema = z.object({
  status: z.enum(['pending', 'training', 'completed', 'failed']).optional(),
  progress: z.number().min(0).max(100).optional(),
  modelKey: z.string().optional(),
  accuracy: z.number().min(0).max(100).optional(),
});

// GET /api/ai/voice-training - Get user's voice training records
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // First get the user's AI profile
    const aiProfile = await prisma.aIProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!aiProfile) {
      return NextResponse.json({
        trainings: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Build where clause
    const where: any = { profileId: aiProfile.id };
    if (status) where.status = status;

    // Fetch voice trainings with pagination
    const [trainings, total] = await Promise.all([
      prisma.voiceTraining.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.voiceTraining.count({ where }),
    ]);

    // Parse sampleKeys from JSON string
    const formattedTrainings = trainings.map(training => ({
      ...training,
      sampleKeys: JSON.parse(training.sampleKeys),
    }));

    return NextResponse.json({
      trainings: formattedTrainings,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching voice trainings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice trainings' },
      { status: 500 }
    );
  }
}

// POST /api/ai/voice-training - Create a new voice training record
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = VoiceTrainingCreateSchema.parse(body);

    // Ensure user has an AI profile
    const aiProfile = await prisma.aIProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        llmProvider: 'deepseek',
        llmModel: 'deepseek-chat',
      },
      update: {},
    });

    // Create voice training record
    const training = await prisma.voiceTraining.create({
      data: {
        userId: session.user.id,
        profileId: aiProfile.id,
        name: validatedData.name,
        version: validatedData.version,
        sampleKeys: JSON.stringify(validatedData.sampleKeys),
        sampleCount: validatedData.sampleCount,
        duration: validatedData.duration,
        status: 'pending',
        progress: 0,
      },
    });

    // Format response
    const formattedTraining = {
      ...training,
      sampleKeys: JSON.parse(training.sampleKeys),
    };

    return NextResponse.json(formattedTraining);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating voice training:', error);
    return NextResponse.json(
      { error: 'Failed to create voice training' },
      { status: 500 }
    );
  }
}

// PATCH /api/ai/voice-training - Update voice training status
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trainingId = searchParams.get('id');
    
    if (!trainingId) {
      return NextResponse.json(
        { error: 'Training ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingTraining = await prisma.voiceTraining.findFirst({
      where: {
        id: trainingId,
        userId: session.user.id,
      },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = VoiceTrainingUpdateSchema.parse(body);

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      
      // Update timestamps based on status
      if (validatedData.status === 'training' && !existingTraining.trainingStartedAt) {
        updateData.trainingStartedAt = new Date();
      } else if (validatedData.status === 'completed' && !existingTraining.trainingCompletedAt) {
        updateData.trainingCompletedAt = new Date();
      }
    }
    
    if (validatedData.progress !== undefined) {
      updateData.progress = validatedData.progress;
    }
    
    if (validatedData.modelKey !== undefined) {
      updateData.modelKey = validatedData.modelKey;
    }
    
    if (validatedData.accuracy !== undefined) {
      updateData.accuracy = validatedData.accuracy;
    }

    const training = await prisma.voiceTraining.update({
      where: { id: trainingId },
      data: updateData,
    });

    // Format response
    const formattedTraining = {
      ...training,
      sampleKeys: JSON.parse(training.sampleKeys),
    };

    // If training is completed, update the user's AI profile with the new voice
    if (validatedData.status === 'completed' && training.modelKey) {
      await prisma.aIProfile.update({
        where: { userId: session.user.id },
        data: { activeVoiceId: training.modelKey },
      });
    }

    return NextResponse.json(formattedTraining);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating voice training:', error);
    return NextResponse.json(
      { error: 'Failed to update voice training' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/voice-training - Delete a voice training record
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trainingId = searchParams.get('id');
    
    if (!trainingId) {
      return NextResponse.json(
        { error: 'Training ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const result = await prisma.voiceTraining.deleteMany({
      where: {
        id: trainingId,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice training:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice training' },
      { status: 500 }
    );
  }
}