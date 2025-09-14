import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

// Schema for validating memory creation/updates
const MemorySchema = z.object({
  type: z.enum(['long_term', 'short_term']),
  category: z.enum(['personal', 'preferences', 'history']),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  tags: z.array(z.string()).optional(),
  score: z.number().min(0).max(10).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// GET /api/ai/memory - Get user's AI memories
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is punked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { punked: true }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { userId: session.user.id };
    if (type) where.type = type;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch memories with pagination
    const [memories, total] = await Promise.all([
      prisma.aIMemory.findMany({
        where,
        orderBy: [
          { score: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.aIMemory.count({ where }),
    ]);

    // Parse metadata and convert tags
    const formattedMemories = memories.map(memory => ({
      ...memory,
      tags: memory.tags ? memory.tags.split(',').filter(Boolean) : [],
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    }));

    return NextResponse.json({
      memories: formattedMemories,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

// POST /api/ai/memory - Create a new memory
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is punked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { punked: true }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = MemorySchema.parse(body);

    // Format data for database
    const dataToCreate: any = {
      userId: session.user.id,
      type: validatedData.type,
      category: validatedData.category,
      title: validatedData.title,
      content: validatedData.content,
      score: validatedData.score || 1.0,
    };

    // Convert tags array to comma-separated string
    if (validatedData.tags) {
      dataToCreate.tags = validatedData.tags.join(',');
    }

    // Convert metadata object to JSON string
    if (validatedData.metadata) {
      dataToCreate.metadata = JSON.stringify(validatedData.metadata);
    }

    // Set expiration for short-term memories if not specified
    if (validatedData.type === 'short_term' && !validatedData.expiresAt) {
      // Default to 30 days for short-term memories
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      dataToCreate.expiresAt = expirationDate;
    } else if (validatedData.expiresAt) {
      dataToCreate.expiresAt = new Date(validatedData.expiresAt);
    }

    const memory = await prisma.aIMemory.create({
      data: dataToCreate,
    });

    // Format response
    const formattedMemory = {
      ...memory,
      tags: memory.tags ? memory.tags.split(',').filter(Boolean) : [],
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    };

    return NextResponse.json(formattedMemory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}

// PATCH /api/ai/memory - Update a memory
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is punked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { punked: true }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('id');
    
    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingMemory = await prisma.aIMemory.findFirst({
      where: {
        id: memoryId,
        userId: session.user.id,
      },
    });

    if (!existingMemory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = MemorySchema.partial().parse(body);

    // Format data for update
    const dataToUpdate: any = {};
    
    if (validatedData.type !== undefined) dataToUpdate.type = validatedData.type;
    if (validatedData.category !== undefined) dataToUpdate.category = validatedData.category;
    if (validatedData.title !== undefined) dataToUpdate.title = validatedData.title;
    if (validatedData.content !== undefined) dataToUpdate.content = validatedData.content;
    if (validatedData.score !== undefined) dataToUpdate.score = validatedData.score;
    
    if (validatedData.tags !== undefined) {
      dataToUpdate.tags = validatedData.tags.join(',');
    }
    
    if (validatedData.metadata !== undefined) {
      dataToUpdate.metadata = JSON.stringify(validatedData.metadata);
    }
    
    if (validatedData.expiresAt !== undefined) {
      dataToUpdate.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null;
    }

    const memory = await prisma.aIMemory.update({
      where: { id: memoryId },
      data: dataToUpdate,
    });

    // Format response
    const formattedMemory = {
      ...memory,
      tags: memory.tags ? memory.tags.split(',').filter(Boolean) : [],
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    };

    return NextResponse.json(formattedMemory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating memory:', error);
    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/memory - Delete a memory
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is punked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { punked: true }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('id');
    
    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const result = await prisma.aIMemory.deleteMany({
      where: {
        id: memoryId,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}