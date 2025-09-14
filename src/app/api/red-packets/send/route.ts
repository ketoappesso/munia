import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authConfig from '@/auth.config';
import prisma from '@/lib/prisma/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    console.log('Session in red packet send:', session);

    if (!session?.user?.id) {
      console.error('No session or user ID found in red packet send');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { recipientId, amount, message, conversationId } = await request.json();

    if (!recipientId || !amount || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    console.log('Red packet request:', { recipientId, amount, message, conversationId });

    // Check sender's balance
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { apeBalance: true, username: true },
    });

    console.log('Sender info:', { userId, balance: sender?.apeBalance });

    if (!sender || sender.apeBalance < amount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        currentBalance: sender?.apeBalance || 0,
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

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.user.update({
        where: { id: userId },
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

      // Create wallet transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          type: 'TRANSFER',
          amount,
          status: 'COMPLETED',
          description: message || `红包转账`,
          fromUserId: userId,
          toUserId: recipientId,
          completedAt: new Date(),
        },
      });

      // Create red packet message
      const redPacketMessage = await tx.message.create({
        data: {
          content: `发送了红包`,
          conversationId,
          senderId: userId,
          type: 'RED_PACKET',
          redPacketAmount: amount,
          redPacketMessage: message,
          redPacketStatus: 'CLAIMED',
          redPacketClaimedAt: new Date(),
        },
      });

      // Update conversation's last message timestamp
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
    console.error('Error sending red packet:', error);
    return NextResponse.json({ error: 'Failed to send red packet' }, { status: 500 });
  }
}
