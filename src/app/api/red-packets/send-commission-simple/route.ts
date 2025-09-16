import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function POST(request: Request) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, acceptorId, amount, conversationId } = await request.json();

    console.log('Received commission request:', { postId, acceptorId, amount, conversationId });

    if (!postId || !acceptorId || !amount || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the post to verify task details
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!post.isTask) {
      return NextResponse.json({ error: 'Post is not a task' }, { status: 400 });
    }

    // The task owner should be sending the commission
    const taskOwnerId = post.userId;
    const taskOwner = await prisma.user.findUnique({
      where: { id: taskOwnerId },
      select: { apeBalance: true },
    });

    // Calculate initial payment (50% of total)
    const initialPayment = amount / 2;
    
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check and deduct from task owner if they have balance
      if (taskOwner && taskOwner.apeBalance >= initialPayment) {
        await tx.user.update({
          where: { id: taskOwnerId },
          data: {
            apeBalance: {
              decrement: initialPayment,
            },
          },
        });
      } else {
        console.log('Task owner has insufficient balance, using system credit');
      }

      // Add initial payment to acceptor
      await tx.user.update({
        where: { id: acceptorId },
        data: {
          apeBalance: {
            increment: initialPayment,
          },
        },
      });

      // Update the post to mark initial payment as made
      await tx.post.update({
        where: { id: postId },
        data: {
          initialPaymentAt: new Date(),
        },
      });

      // Create wallet transaction record for initial payment
      const transaction = await tx.walletTransaction.create({
        data: {
          type: 'REWARD',
          amount: initialPayment,
          status: 'COMPLETED',
          description: `任务佣金（首付50%） - ${post.content?.substring(0, 50)}`,
          fromUserId: taskOwnerId,
          toUserId: acceptorId,
          completedAt: new Date(),
        },
      });

      // Create red packet message (from task owner to acceptor)
      const redPacketMessage = await tx.message.create({
        data: {
          content: `任务佣金红包（首付）`,
          conversationId,
          senderId: taskOwnerId, // Message appears from task owner
          type: 'RED_PACKET',
          redPacketAmount: initialPayment,
          redPacketMessage: `任务佣金首付 ${initialPayment} APE（共${amount} APE）- 完成任务后可获得剩余50%！`,
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

    console.log('Commission red packet sent successfully:', result);

    return NextResponse.json({
      success: true,
      transactionId: result.transaction.id,
      messageId: result.message.id,
    });
  } catch (error) {
    console.error('Error sending commission red packet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to send commission red packet',
      details: errorMessage 
    }, { status: 500 });
  }
}
