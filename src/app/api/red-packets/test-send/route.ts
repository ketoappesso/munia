import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

// WARNING: This is for testing only - it bypasses authentication!
// Remove this in production!

export async function POST(request: NextRequest) {
  try {
    const { recipientId, amount, message, conversationId, senderId } = await request.json();

    console.log('TEST red packet send request:', { 
      recipientId, 
      amount, 
      message, 
      conversationId,
      senderId
    });

    // Use the senderId from the request, or fallback to hardcoded value for testing
    let actualSenderId = senderId;
    let sender;
    
    if (actualSenderId) {
      // Use provided sender ID
      sender = await prisma.user.findUnique({
        where: { id: actualSenderId },
        select: {
          id: true,
          username: true,
          apeBalance: true
        }
      });
    } else {
      // Fallback to hardcoded sender for testing
      const SENDER_USERNAME = '14474744444';
      sender = await prisma.user.findFirst({
        where: {
          OR: [
            { username: SENDER_USERNAME },
            { phoneNumber: SENDER_USERNAME }
          ]
        },
        select: {
          id: true,
          username: true,
          apeBalance: true
        }
      });
    }

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    console.log('Sender:', sender);

    if (sender.apeBalance < amount) {
      return NextResponse.json({ 
        error: `Insufficient balance: ${sender.apeBalance} < ${amount}`,
        currentBalance: sender.apeBalance,
        requiredAmount: amount 
      }, { status: 400 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.user.update({
        where: { id: sender.id },
        data: {
          apeBalance: {
            decrement: amount,
          },
        },
      });

      // Add to recipient  
      await tx.user.update({
        where: { id: recipientId },
        data: {
          apeBalance: {
            increment: amount,
          },
        },
      });

      // Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          type: 'TRANSFER',
          amount,
          status: 'COMPLETED',
          description: message || `红包转账`,
          fromUserId: sender.id,
          toUserId: recipientId,
          completedAt: new Date(),
        },
      });

      // Create red packet message
      const redPacketMessage = await tx.message.create({
        data: {
          content: `发送了红包`,
          conversationId,
          senderId: sender.id,  // Use the actual sender's ID
          type: 'RED_PACKET',
          redPacketAmount: amount,
          redPacketMessage: message,
          redPacketStatus: 'CLAIMED',
          redPacketClaimedAt: new Date(),
        },
      });

      // Update conversation
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return { transaction, message: redPacketMessage };
    });

    return NextResponse.json({
      success: true,
      transactionId: result.transaction.id,
      messageId: result.message.id,
    });
    
  } catch (error) {
    console.error('Error in TEST red packet send:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send red packet'
    }, { status: 500 });
  }
}
