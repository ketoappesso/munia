/**
 * POST /api/posts/[postId]/confirm-completion
 * - Allows task owner to confirm or deny task completion
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
    const { approved } = await request.json();

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
        error: 'Task completion has not been requested. Current status: ' + post.taskStatus 
      }, { status: 400 });
    }

    const conversationId = [user.id, post.completedBy!].sort().join('_');

    if (approved) {
      // Process final payment
      const result = await prisma.$transaction(async (tx) => {
        // Get final payment amount
        const finalPayment = post.finalPaymentAmount || 0;
        
        if (finalPayment > 0) {
          // Check task owner's balance
          const taskOwner = await tx.user.findUnique({
            where: { id: user.id },
            select: { apeBalance: true },
          });

          if (taskOwner && taskOwner.apeBalance >= finalPayment) {
            // Deduct from task owner
            await tx.user.update({
              where: { id: user.id },
              data: {
                apeBalance: {
                  decrement: finalPayment,
                },
              },
            });
          }

          // Add to acceptor
          await tx.user.update({
            where: { id: post.completedBy! },
            data: {
              apeBalance: {
                increment: finalPayment,
              },
            },
          });

          // Create wallet transaction
          await tx.walletTransaction.create({
            data: {
              type: 'REWARD',
              amount: finalPayment,
              status: 'COMPLETED',
              description: `任务佣金（尾款50%） - ${post.content?.substring(0, 50)}`,
              fromUserId: user.id,
              toUserId: post.completedBy!,
              completedAt: new Date(),
            },
          });

          // Create red packet message for final payment
          await tx.message.create({
            data: {
              content: `任务佣金红包（尾款）`,
              conversationId,
              senderId: user.id,
              type: 'RED_PACKET',
              redPacketAmount: finalPayment,
              redPacketMessage: `任务完成确认！尾款 ${finalPayment} APE 已发放，感谢您的努力！`,
              redPacketStatus: 'CLAIMED',
              redPacketClaimedAt: new Date(),
            },
          });
        }

        // Update post status
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: {
            taskStatus: 'COMPLETED',
            completionConfirmedAt: new Date(),
            finalPaymentAt: new Date(),
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
          type: 'TASK_COMPLETED',
          sourceId: postId,
          targetId: postId,
          sourceUserId: user.id,
          targetUserId: post.completedBy!,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task completion confirmed and final payment sent',
        post: result,
      });
    } else {
      // Deny completion
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          taskStatus: 'IN_PROGRESS',
          completionRequestedAt: null,
        },
      });

      // Send rejection message
      await prisma.message.create({
        data: {
          content: `❌ 任务完成申请被拒绝\\n\\n请继续完成任务后重新申请`,
          conversationId,
          senderId: user.id,
          type: 'SYSTEM',
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Create activity notification
      await prisma.activity.create({
        data: {
          type: 'TASK_COMPLETION_DENIED',
          sourceId: postId,
          targetId: postId,
          sourceUserId: user.id,
          targetUserId: post.completedBy!,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task completion denied',
        post: updatedPost,
      });
    }
  } catch (error) {
    console.error('Error confirming task completion:', error);
    return NextResponse.json({ error: 'Failed to confirm task completion' }, { status: 500 });
  }
}
