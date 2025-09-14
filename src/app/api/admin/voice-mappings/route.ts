import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

// Admin phone number for authorization
const ADMIN_PHONE = '18874748888';

export async function GET(request: Request) {
  try {
    console.log('Voice mappings API: Starting request');

    const session = await auth();
    console.log('Voice mappings API: Session data:', {
      hasSession: !!session,
      userId: session?.user?.id,
      username: session?.user?.username,
      phoneNumber: session?.user?.phoneNumber
    });

    // Check if user is authorized admin - also check phoneNumber field
    const isAdmin = session?.user && (
      session.user.username === ADMIN_PHONE ||
      session.user.phoneNumber === ADMIN_PHONE
    );

    if (!isAdmin) {
      console.log('Voice mappings API: Unauthorized access attempt', {
        username: session?.user?.username,
        phoneNumber: session?.user?.phoneNumber,
        expected: ADMIN_PHONE
      });
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
        { ttsVoiceId: { contains: search } }
      ];
    }

    if (hasVoice === 'true') {
      where.ttsVoiceId = { not: null };
    } else if (hasVoice === 'false') {
      where.ttsVoiceId = null;
    }

    // Get total count
    const totalCount = await prisma.user.count({ where });

    // Get users with voice mappings
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        name: true,
        ttsVoiceId: true,
        ttsRemainingTrainings: true,
        punked: true,
        profilePhoto: true,
        walletCreatedAt: true, // Use walletCreatedAt as a proxy for registration date
      },
      orderBy: [
        { ttsVoiceId: 'desc' }, // Users with voice IDs first
        { id: 'desc' } // Then by ID (which is chronological)
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
    console.error('Error fetching voice mappings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch update voice mappings
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check if user is authorized admin - also check phoneNumber field
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
    const { mappings } = body;

    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'Invalid request - mappings must be an array' },
        { status: 400 }
      );
    }

    // Validate all mappings first
    for (const mapping of mappings) {
      if (!mapping.userId || typeof mapping.voiceId !== 'string') {
        return NextResponse.json(
          { error: 'Invalid mapping format - userId and voiceId required' },
          { status: 400 }
        );
      }

      // Validate voice ID format (should start with S_ or be empty)
      if (mapping.voiceId && !mapping.voiceId.startsWith('S_') && !['BV001', 'BV002', 'BV003', 'BV004', 'BV005'].includes(mapping.voiceId)) {
        return NextResponse.json(
          { error: `Invalid voice ID format: ${mapping.voiceId}. Must start with S_ or be a standard voice (BV001-BV005)` },
          { status: 400 }
        );
      }
    }

    // Perform batch update
    const updatePromises = mappings.map(mapping =>
      prisma.user.update({
        where: { id: mapping.userId },
        data: {
          ttsVoiceId: mapping.voiceId || null,
          punked: !!mapping.voiceId && mapping.voiceId.startsWith('S_'), // Set punked if custom voice
        },
      })
    );

    const results = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      updated: results.length,
      message: `Successfully updated ${results.length} voice mappings`,
    });
  } catch (error) {
    console.error('Error batch updating voice mappings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}