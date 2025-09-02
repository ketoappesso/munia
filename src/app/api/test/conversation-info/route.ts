import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user 14474744444
    const user1 = await prisma.user.findFirst({
      where: {
        OR: [
          { username: '14474744444' },
          { phoneNumber: '14474744444' }
        ]
      }
    });
    
    // Get user 19974749999
    const user2 = await prisma.user.findFirst({
      where: {
        OR: [
          { username: '19974749999' },
          { phoneNumber: '19974749999' }
        ]
      }
    });
    
    if (!user1 || !user2) {
      return NextResponse.json({ 
        error: 'Users not found',
        user1Found: !!user1,
        user2Found: !!user2
      }, { status: 404 });
    }
    
    // Find conversation between them
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: user1.id,
            participant2Id: user2.id
          },
          {
            participant1Id: user2.id,
            participant2Id: user1.id
          }
        ]
      }
    });
    
    // Get recent messages
    let recentMessages = [];
    if (conversation) {
      recentMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          content: true,
          type: true,
          redPacketAmount: true,
          redPacketMessage: true,
          createdAt: true,
          sender: {
            select: {
              username: true
            }
          }
        }
      });
    }
    
    return NextResponse.json({
      user1: {
        id: user1.id,
        username: user1.username,
        balance: user1.apeBalance
      },
      user2: {
        id: user2.id,
        username: user2.username,
        balance: user2.apeBalance
      },
      conversation: conversation ? {
        id: conversation.id,
        createdAt: conversation.createdAt
      } : null,
      recentMessages: recentMessages
    });
  } catch (error) {
    console.error('Error getting conversation info:', error);
    return NextResponse.json({ error: 'Failed to get conversation info' }, { status: 500 });
  }
}
