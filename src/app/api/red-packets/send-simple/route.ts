import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function POST(request: NextRequest) {
  try {
    const { recipientId, amount, message, conversationId, senderId } = await request.json();

    console.log('Simple red packet send request:', { 
      recipientId, 
      amount, 
      message, 
      conversationId,
      senderId 
    });

    if (!recipientId || !amount || !conversationId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { recipientId, amount, conversationId }
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // For now, we'll use a hardcoded sender ID or get it from the request
    // This is a temporary workaround for the auth issue
    let actualSenderId = senderId;
    
    if (!actualSenderId) {
      // Try to find the sender by username 14474744444
      const sender = await prisma.user.findFirst({
        where: {
          OR: [
            { username: '14474744444' },
            { phoneNumber: '14474744444' }
          ]
        }
      });
      
      if (sender) {
        actualSenderId = sender.id;
        console.log('Found sender by username:', sender.id);
      } else {
        return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
      }
    }

    // Check sender's balance
    const sender = await prisma.user.findUnique({
      where: { id: actualSenderId },
      select: { apeBalance: true, username: true },
    });

    console.log('Sender info:', { 
      senderId: actualSenderId, 
      balance: sender?.apeBalance,
      username: sender?.username 
    });

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    if (sender.apeBalance < amount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        currentBalance: sender.apeBalance,
        requiredAmount: amount 
      }, { status: 400 });
    }

    // Ensure recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, username: true },
    });

    console.log('Recipient info:', recipient);

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('Starting transaction...');

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const updatedSender = await tx.user.update({
        where: { id: actualSenderId },
        data: {
          apeBalance: {
            decrement: amount,
          },
        },
      });

      console.log('Deducted from sender, new balance:', updatedSender.apeBalance);

      // Add to recipient
      const updatedRecipient = await tx.user.update({
        where: { id: recipientId },
        data: {
          apeBalance: {
            increment: amount,
          },
        },
      });

      console.log('Added to recipient, new balance:', updatedRecipient.apeBalance);

      // Create wallet transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          type: 'TRANSFER',
          amount,
          status: 'COMPLETED',
          description: message || `红包转账`,
          fromUserId: actualSenderId,
          toUserId: recipientId,
          completedAt: new Date(),
        },
      });

      console.log('Created wallet transaction:', transaction.id);

      // Create red packet message
      const redPacketMessage = await tx.message.create({
        data: {
          content: `发送了红包`,
          conversationId,
          senderId: actualSenderId,
          type: 'RED_PACKET',
          redPacketAmount: amount,
          redPacketMessage: message,
          redPacketStatus: 'CLAIMED',
          redPacketClaimedAt: new Date(),
        },
      });

      console.log('Created red packet message:', redPacketMessage.id);

      // Update conversation's last message timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return { transaction, message: redPacketMessage };
    });

    console.log('Transaction completed successfully');

    return NextResponse.json({
      success: true,
      transactionId: result.transaction.id,
      messageId: result.message.id,
    });
  } catch (error) {
    console.error('Error in simple red packet send:', error);
    
    // Return more detailed error information
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Failed to send red packet',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to send red packet',
      details: 'Unknown error'
    }, { status: 500 });
  }
}
