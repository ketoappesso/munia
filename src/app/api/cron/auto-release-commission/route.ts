/**
 * GET /api/cron/auto-release-commission
 * - Automatically releases remaining commission after 7 days
 * - This should be called by a cron job every hour or day
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // For development, allow without auth
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Find all tasks that have requested completion more than 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tasksToAutoComplete = await prisma.post.findMany({
      where: {
        isTask: true,
        taskStatus: 'COMPLETION_REQUESTED',
        completionRequestedAt: {
          lte: sevenDaysAgo,
        },
        finalPaymentAt: null, // Not yet paid
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${tasksToAutoComplete.length} tasks to auto-complete`);

    const results = [];
    
    for (const post of tasksToAutoComplete) {
      try {
        const conversationId = [post.userId, post.completedBy!].sort().join('_');
        
        const result = await prisma.$transaction(async (tx) => {
          // Get final payment amount
          const finalPayment = post.finalPaymentAmount || 0;
          
          if (finalPayment > 0) {
            // Check task owner's balance
            const taskOwner = await tx.user.findUnique({
              where: { id: post.userId },
              select: { apeBalance: true },
            });

            if (taskOwner && taskOwner.apeBalance >= finalPayment) {
              // Deduct from task owner
              await tx.user.update({
                where: { id: post.userId },
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
                description: `任务佣金（自动发放尾款） - ${post.content?.substring(0, 50)}`,
                fromUserId: post.userId,
                toUserId: post.completedBy!,
                completedAt: new Date(),
              },
            });

            // Create red packet message for final payment
            await tx.message.create({
              data: {
                content: `任务佣金红包（自动发放）`,
                conversationId,
                senderId: post.userId,
                type: 'RED_PACKET',
                redPacketAmount: finalPayment,
                redPacketMessage: `系统自动确认！尾款 ${finalPayment} APE 已发放（7天未确认自动发放）`,
                redPacketStatus: 'CLAIMED',
                redPacketClaimedAt: new Date(),
              },
            });
          }

          // Update post status
          const updatedPost = await tx.post.update({
            where: { id: post.id },
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
            type: 'TASK_AUTO_COMPLETED',
            sourceId: post.id,
            targetId: post.id,
            sourceUserId: post.completedBy!,
            targetUserId: post.userId,
          },
        });

        results.push({
          postId: post.id,
          status: 'success',
          message: `Auto-completed task ${post.id} and released ${post.finalPaymentAmount} APE`,
        });
      } catch (error) {
        console.error(`Error auto-completing task ${post.id}:`, error);
        results.push({
          postId: post.id,
          status: 'error',
          message: `Failed to auto-complete task ${post.id}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${tasksToAutoComplete.length} tasks`,
      results,
    });
  } catch (error) {
    console.error('Error in auto-release commission cron:', error);
    return NextResponse.json({ error: 'Failed to auto-release commissions' }, { status: 500 });
  }
}
