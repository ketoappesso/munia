import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

// GET /api/voice/roles - Get available voice roles
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get system roles and user's custom roles
    const roles = await prisma.voiceRole.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: session.user.id }
        ]
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // If no roles exist, create default system roles
    if (roles.length === 0) {
      const defaultRoles = [
        {
          id: 'assistant',
          name: 'AI助手',
          description: '通用智能助手，可以回答问题、聊天对话',
          isSystem: true,
          config: {
            model: 'default',
            voice: 'standard',
            personality: 'friendly'
          }
        },
        {
          id: 'teacher',
          name: 'AI老师',
          description: '教育辅导助手，帮助学习和解答疑问',
          isSystem: true,
          config: {
            model: 'educational',
            voice: 'professional',
            personality: 'patient'
          }
        },
        {
          id: 'companion',
          name: '陪伴助手',
          description: '情感陪伴和日常聊天',
          isSystem: true,
          config: {
            model: 'conversational',
            voice: 'warm',
            personality: 'empathetic'
          }
        }
      ];

      await prisma.voiceRole.createMany({
        data: defaultRoles
      });

      const createdRoles = await prisma.voiceRole.findMany({
        where: { isSystem: true }
      });

      return NextResponse.json({ roles: createdRoles });
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching voice roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice roles' },
      { status: 500 }
    );
  }
}

// POST /api/voice/roles - Create custom voice role
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, config } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Generate unique role ID
    const roleId = `role_${session.user.id}_${Date.now()}`;

    const role = await prisma.voiceRole.create({
      data: {
        id: roleId,
        name,
        description: description || '',
        userId: session.user.id,
        isSystem: false,
        config: config || {}
      }
    });

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error creating voice role:', error);
    return NextResponse.json(
      { error: 'Failed to create voice role' },
      { status: 500 }
    );
  }
}