import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Admin phone number for authorization
const ADMIN_PHONE = '18874748888';

// Validation schema for creating user
const CreateUserSchema = z.object({
  phoneNumber: z.string().min(1),
  password: z.string().min(6),
  name: z.string().optional(),
  email: z.string().optional(),
  voiceId: z.string().optional()
});

// GET - List all users with pagination and filtering
export async function GET(request: Request) {
  try {
    console.log('Admin users API: Starting request');

    const session = await auth();
    console.log('Admin users API: Session data:', {
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
      console.log('Admin users API: Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get search params for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const hasVoice = searchParams.get('hasVoice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search } },
        { name: { contains: search } },
        { username: { contains: search } },
        { ttsVoiceId: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (hasVoice === 'true') {
      where.ttsVoiceId = { not: null };
    } else if (hasVoice === 'false') {
      where.ttsVoiceId = null;
    }

    // Get total count
    const totalCount = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        name: true,
        email: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true,
        punked: true,
        profilePhoto: true,
        walletCreatedAt: true,
      },
      orderBy: [
        { ttsVoiceId: 'desc' }, // Users with voice IDs first
        { id: 'desc' } // Then by ID (chronological)
      ],
      skip,
      take: limit,
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: Request) {
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

    const body = await request.json();
    console.log('Create user request - phoneNumber:', body.phoneNumber, 'hasPassword:', !!body.password, 'name:', body.name, 'email:', body.email, 'voiceId:', body.voiceId);

    // Clean up empty strings
    const cleanedBody = {
      phoneNumber: body.phoneNumber,
      password: body.password,
      name: body.name && body.name.trim() !== '' ? body.name : undefined,
      email: body.email && body.email.trim() !== '' ? body.email : undefined,
      voiceId: body.voiceId && body.voiceId.trim() !== '' ? body.voiceId : undefined
    };

    // Validate request body
    const validationResult = CreateUserSchema.safeParse(cleanedBody);
    if (!validationResult.success) {
      console.error('Validation failed for cleaned body:', cleanedBody);
      console.error('Validation errors:', validationResult.error.issues);
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { phoneNumber, password, name, email, voiceId } = validationResult.data;

    // Additional email validation if email is provided
    if (email && email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          { username: phoneNumber },
          ...(email && email !== '' ? [{ email }] : [])
        ]
      }
    });

    if (existingUser) {
      console.log('User already exists with phone:', phoneNumber);
      return NextResponse.json(
        { error: `手机号 ${phoneNumber} 已被注册，请使用其他手机号` },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        phoneNumber,
        username: phoneNumber, // Use phone as username initially
        passwordHash,
        name: name && name !== '' ? name : null,
        email: email && email !== '' ? email : null,
        ttsVoiceId: voiceId && voiceId !== '' ? voiceId : null,
        punked: voiceId && voiceId !== '' ? voiceId.startsWith('S_') : false,
        ttsRemainingTrainings: 5,
      },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        name: true,
        email: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true,
        punked: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `User created successfully`
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}