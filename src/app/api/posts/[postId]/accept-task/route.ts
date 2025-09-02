/**
 * POST /api/posts/[postId]/accept-task
 * - Allows a user to accept a task
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const [user] = await getServerUser();
    if (!user) return NextResponse.json({}, { status: 401 });

    const postId = parseInt(params.postId, 10);
    const { acceptorId } = await request.json();

    // Verify the post exists and is a task
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!post.isTask) {
      return NextResponse.json({ error: 'This is not a task post' }, { status: 400 });
    }

    if (post.taskStatus === 'COMPLETED') {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
    }

    if (post.taskStatus === 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Task already in progress' }, { status: 400 });
    }
    
    if (post.taskStatus === 'COMPLETION_REQUESTED') {
      return NextResponse.json({ error: 'Task completion is pending confirmation' }, { status: 400 });
    }

    if (post.userId === user.id) {
      return NextResponse.json({ error: 'Cannot accept your own task' }, { status: 400 });
    }

    // Calculate payment split (50% initial, 50% final)
    const initialPayment = post.rewardAmount * 0.5;
    const finalPayment = post.rewardAmount * 0.5;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update the task status and payment amounts
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          taskStatus: 'IN_PROGRESS',
          completedBy: user.id,
          completedAt: new Date(), // Set the timestamp when task is accepted
          initialPaymentAmount: initialPayment,
          finalPaymentAmount: finalPayment,
          initialPaymentAt: new Date(), // Mark initial payment as made
        },
      });
      
      // Transfer 50% initial payment to acceptor
      // Note: The full amount was already deducted from task owner when creating the task
      await tx.user.update({
        where: { id: user.id },
        data: {
          apeBalance: {
            increment: initialPayment,
          },
        },
      });
      
      // Create wallet transaction for initial payment
      await tx.walletTransaction.create({
        data: {
          type: 'REWARD',
          amount: initialPayment,
          status: 'COMPLETED',
          description: `任务佣金（首付50%） - ${post.content?.substring(0, 50)}`,
          fromUserId: post.userId,
          toUserId: user.id,
          completedAt: new Date(),
        },
      });
      
      return updatedPost;
    });
    
    const updatedPost = result;

    // Create activity log for task acceptance
    await prisma.activity.create({
      data: {
        type: 'TASK_ACCEPTED',
        sourceId: postId,
        targetId: postId,
        sourceUserId: user.id,
        targetUserId: post.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task accepted successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error accepting task:', error);
    return NextResponse.json({ error: 'Failed to accept task' }, { status: 500 });
  }
}
