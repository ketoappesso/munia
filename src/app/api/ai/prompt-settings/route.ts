import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and AI profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        punked: true,
        aiProfile: {
          select: {
            systemPrompt: true,
            roleTemplate: true
          }
        }
      }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available' }, { status: 403 });
    }

    return NextResponse.json({
      systemPrompt: user.aiProfile?.systemPrompt || '你是一个友善、智慧的AI助理，总是乐于帮助用户解决问题。请用温和、专业的语调回答用户的问题。',
      role: user.aiProfile?.roleTemplate || 'assistant'
    });
  } catch (error) {
    console.error('Error fetching prompt settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { systemPrompt, role } = await request.json();

    if (!systemPrompt) {
      return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });
    }

    // Check if user is punked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { punked: true }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available' }, { status: 403 });
    }

    // Update or create AI profile
    const aiProfile = await prisma.aiProfile.upsert({
      where: { userId: session.user.id },
      update: {
        systemPrompt: systemPrompt,
        roleTemplate: role || 'assistant'
      },
      create: {
        userId: session.user.id,
        systemPrompt: systemPrompt,
        roleTemplate: role || 'assistant'
      },
      select: {
        systemPrompt: true,
        roleTemplate: true
      }
    });

    return NextResponse.json({
      success: true,
      systemPrompt: aiProfile.systemPrompt,
      role: aiProfile.roleTemplate
    });
  } catch (error) {
    console.error('Error saving prompt settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}