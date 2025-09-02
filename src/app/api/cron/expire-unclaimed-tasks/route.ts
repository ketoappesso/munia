/**
 * GET /api/cron/expire-unclaimed-tasks
 * - Cron job to expire unclaimed tasks after 30 days and refund the poster
 * - Should be run daily
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by a cron job (you can add additional security here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all tasks that are:
    // 1. Still OPEN (unclaimed)
    // 2. Created more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredTasks = await prisma.post.findMany({
      where: {
        isTask: true,
        taskStatus: 'OPEN',
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${expiredTasks.length} expired unclaimed tasks`);

    let refundedCount = 0;
    let totalRefunded = 0;

    // Process each expired task
    for (const task of expiredTasks) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update task status to EXPIRED
          await tx.post.update({
            where: { id: task.id },
            data: {
              taskStatus: 'EXPIRED',
              completionConfirmedAt: new Date(),
            },
          });

          // Refund the full commission back to the poster
          if (task.rewardAmount > 0) {
            await tx.user.update({
              where: { id: task.userId },
              data: {
                apeBalance: {
                  increment: task.rewardAmount,
                },
              },
            });

            // Create wallet transaction for refund
            await tx.walletTransaction.create({
              data: {
                type: 'REFUND',
                amount: task.rewardAmount,
                status: 'COMPLETED',
                description: `任务过期退款（30天无人揭榜） - ${task.content?.substring(0, 50)}`,
                fromUserId: task.userId,
                toUserId: task.userId,
                completedAt: new Date(),
              },
            });

            // Create activity notification
            await tx.activity.create({
              data: {
                type: 'TASK_EXPIRED',
                sourceId: task.id,
                targetId: task.id,
                sourceUserId: task.userId,
                targetUserId: task.userId,
                isNotificationActive: true,
              },
            });

            totalRefunded += task.rewardAmount;
          }

          refundedCount++;
        });

        console.log(`Expired and refunded task ${task.id} - ${task.rewardAmount} APE`);
      } catch (error) {
        console.error(`Error processing expired task ${task.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${refundedCount} expired tasks`,
      totalRefunded,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in expire-unclaimed-tasks cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process expired tasks' },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
