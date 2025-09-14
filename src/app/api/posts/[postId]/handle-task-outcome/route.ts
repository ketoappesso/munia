/**
 * POST /api/posts/[postId]/handle-task-outcome
 * - Allows task owner to handle different task outcomes (refund, failure)
 */
import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function POST(request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const [user] = await getServerUser();
    if (!user) return NextResponse.json({}, { status: 401 });

    const postId = parseInt(params.postId, 10);
    const { action } = await request.json(); // 'refund' or 'fail'

    // Get the post
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

    // Verify the user is the task owner
    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'You are not the task owner' }, { status: 403 });
    }

    // Check current status
    if (post.taskStatus !== 'COMPLETION_REQUESTED') {
      return NextResponse.json({ 
        error: 'This action can only be performed when task completion is requested. Current status: ' + post.taskStatus 
      }, { status: 400 });
    }

    if (!post.completedBy) {
      return NextResponse.json({ error: 'No acceptor found for this task' }, { status: 400 });
    }

    const conversationId = [user.id, post.completedBy].sort().join('_');
    const finalPayment = post.finalPaymentAmount || 0;
    
    if (action === 'refund') {
      // Refund the remaining 50% commission back to the task owner
      const result = await prisma.$transaction(async (tx) => {
        if (finalPayment > 0) {
          // Return the reserved funds back to task owner
          await tx.user.update({
            where: { id: user.id },
            data: {
              apeBalance: {
                increment: finalPayment,
              },
            },
          });

          // Create wallet transaction for refund
          await tx.walletTransaction.create({
            data: {
              type: 'REFUND',
              amount: finalPayment,
              status: 'COMPLETED',
              description: `任务尾款退回 - ${post.content?.substring(0, 50)}`,
              fromUserId: user.id,
              toUserId: user.id,
              completedAt: new Date(),
            },
          });

          // Send notification message
          await tx.message.create({
            data: {
              content: `⚠️ 任务尾款已拒付\\n\\n任务已结束，${finalPayment} APE 尾款已退回发布者账户`,
              conversationId,
              senderId: user.id,
              type: 'SYSTEM',
            },
          });
        }

        // Update post status to ENDED (任务结束)
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: {
            taskStatus: 'ENDED',
            completionConfirmedAt: new Date(),
          },
        });

        // Update conversation
        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        return updatedPost;
      });

      // Create activity notification
      await prisma.activity.create({
        data: {
          type: 'TASK_REFUNDED',
          sourceId: postId,
          targetId: postId,
          sourceUserId: user.id,
          targetUserId: post.completedBy,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task ended with refund',
        post: result,
      });
      
    } else if (action === 'fail') {
      // Mark task as failed and refund
      const result = await prisma.$transaction(async (tx) => {
        if (finalPayment > 0) {
          // Return the reserved funds back to task owner
          await tx.user.update({
            where: { id: user.id },
            data: {
              apeBalance: {
                increment: finalPayment,
              },
            },
          });

          // Create wallet transaction for refund
          await tx.walletTransaction.create({
            data: {
              type: 'REFUND',
              amount: finalPayment,
              status: 'COMPLETED',
              description: `任务失败退款 - ${post.content?.substring(0, 50)}`,
              fromUserId: user.id,
              toUserId: user.id,
              completedAt: new Date(),
            },
          });

          // Send notification message
          await tx.message.create({
            data: {
              content: `❌ 任务已标记为失败\\n\\n${finalPayment} APE 尾款已退回发布者账户`,
              conversationId,
              senderId: user.id,
              type: 'SYSTEM',
            },
          });
        }

        // Update post status to FAILED
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: {
            taskStatus: 'FAILED',
            completionConfirmedAt: new Date(),
          },
        });

        // Update conversation
        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        return updatedPost;
      });

      // Create activity notification
      await prisma.activity.create({
        data: {
          type: 'TASK_FAILED',
          sourceId: postId,
          targetId: postId,
          sourceUserId: user.id,
          targetUserId: post.completedBy,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task marked as failed',
        post: result,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling task outcome:', error);
    return NextResponse.json({ error: 'Failed to handle task outcome' }, { status: 500 });
  }
}
