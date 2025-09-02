/**
 * POST /api/posts/[postId]/handle-completion
 * - Allows task owner to handle completion request with different actions
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
    const { action, messageId } = await request.json(); // action: 'complete' | 'reject' | 'fail'

    // Get the post
    const postData = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const post = postData;

    // Verify the user is the task owner
    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'You are not the task owner' }, { status: 403 });
    }

    // Check current status
    if (post.taskStatus !== 'COMPLETION_REQUESTED') {
      return NextResponse.json({ 
        error: 'Task completion has not been requested' 
      }, { status: 400 });
    }

    const conversationId = [user.id, post.completedBy!].sort().join('_');
    let updatedPost;
    let systemMessage = '';

    switch (action) {
      case 'complete':
        // Update task status to completed and transfer final payment
        updatedPost = await prisma.$transaction(async (tx) => {
          // Update post status
          const post = await tx.post.update({
            where: { id: postId },
            data: {
              taskStatus: 'COMPLETED',
              finalPaymentAt: new Date(),
              completionConfirmedAt: new Date(),
            },
          });
          
          // Transfer final payment to acceptor (money already deducted from owner when task was created)
          const finalPayment = postData.finalPaymentAmount || 0;
          if (finalPayment > 0) {
            await tx.user.update({
              where: { id: postData.completedBy! },
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
                description: `任务佣金（尾款50%） - ${postData.content?.substring(0, 50)}`,
                fromUserId: user.id,
                toUserId: postData.completedBy!,
                completedAt: new Date(),
              },
            });
            
            // Send final payment notification as red packet message
            await tx.message.create({
              data: {
                content: `恭喜！任务已完成`,
                conversationId,
                senderId: user.id,
                type: 'RED_PACKET',
                redPacketAmount: finalPayment,
                redPacketMessage: '任务完成尾款',
                redPacketStatus: 'CLAIMED', // Auto-claimed
                redPacketClaimedAt: new Date(),
              },
            });
          }
          
          return post;
        });

        systemMessage = '✅ 任务已完成，尾款已发放';
        break;

      case 'reject':
        // Task not successful - refund the 50% final payment back to task owner
        updatedPost = await prisma.$transaction(async (tx) => {
          // Update post status
          const post = await tx.post.update({
            where: { id: postId },
            data: {
              taskStatus: 'COMPLETED', // Mark as completed but without final payment
              completionConfirmedAt: new Date(),
            },
          });
          
          // Refund the 50% final payment back to task owner
          const finalPayment = postData.finalPaymentAmount || 0;
          if (finalPayment > 0) {
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
                description: `任务尾款退回（未达标） - ${postData.content?.substring(0, 50)}`,
                fromUserId: user.id,
                toUserId: user.id,
                completedAt: new Date(),
              },
            });
          }
          
          return post;
        });

        systemMessage = '⚠️ 任务未达标，尾款已退回';
        break;

      case 'fail':
        // Task failed - refund the 50% final payment back to task owner
        updatedPost = await prisma.$transaction(async (tx) => {
          // Update post status
          const post = await tx.post.update({
            where: { id: postId },
            data: {
              taskStatus: 'FAILED',
              completionConfirmedAt: new Date(),
            },
          });
          
          // Refund the 50% final payment back to task owner
          const finalPayment = postData.finalPaymentAmount || 0;
          if (finalPayment > 0) {
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
                description: `任务尾款退回（失败） - ${postData.content?.substring(0, 50)}`,
                fromUserId: user.id,
                toUserId: user.id,
                completedAt: new Date(),
              },
            });
          }
          
          return post;
        });

        systemMessage = '❌ 任务失败 - 尾款已退回，可联系客服索赔';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the task completion message status
    if (messageId) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          taskCompletionStatus: action === 'complete' ? 'completed' : 
                               action === 'reject' ? 'rejected' : 'failed',
        },
      });
    }

    // Send a system message about the decision
    await prisma.message.create({
      data: {
        content: systemMessage,
        conversationId,
        senderId: user.id,
        type: 'SYSTEM',
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Create activity notification
    await prisma.activity.create({
      data: {
        type: action === 'complete' ? 'TASK_COMPLETED' : 
              action === 'reject' ? 'TASK_REJECTED' : 'TASK_FAILED',
        sourceId: postId,
        targetId: postId,
        sourceUserId: user.id,
        targetUserId: post.completedBy!,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Task ${action} successfully`,
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error handling task completion:', error);
    return NextResponse.json({ error: 'Failed to handle task completion' }, { status: 500 });
  }
}
