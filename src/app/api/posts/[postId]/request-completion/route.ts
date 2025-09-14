/**
 * POST /api/posts/[postId]/request-completion
 * - Allows task acceptor to request completion and remaining payment
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

    // Verify the user is the task acceptor
    if (post.completedBy !== user.id) {
      return NextResponse.json({ error: 'You are not the task acceptor' }, { status: 403 });
    }

    // Check current status
    if (post.taskStatus !== 'IN_PROGRESS') {
      return NextResponse.json({ 
        error: 'Task is not in progress. Current status: ' + post.taskStatus 
      }, { status: 400 });
    }

    // Update task status to completion requested
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        taskStatus: 'COMPLETION_REQUESTED',
        completionRequestedAt: new Date(),
      },
    });

    // Create activity notification for task owner
    await prisma.activity.create({
      data: {
        type: 'TASK_COMPLETION_REQUESTED',
        sourceId: postId,
        targetId: postId,
        sourceUserId: user.id,
        targetUserId: post.userId,
      },
    });

    // Send a task completion request message to the conversation
    const conversationId = [user.id, post.userId].sort().join('_');
    
    // Get acceptor information
    const acceptor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, username: true },
    });
    
    try {
      // Ensure finalPaymentAmount is set, calculate if needed
      const finalAmount = post.finalPaymentAmount || (post.rewardAmount * 0.5);
      
      await prisma.message.create({
        data: {
          content: `任务完成申请已提交`,
          conversationId,
          senderId: user.id,
          type: 'TASK_COMPLETION_REQUEST',
          taskPostId: postId,
          taskFinalAmount: finalAmount,
          taskCompletionStatus: 'pending',
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });
    } catch (error) {
      console.log('Failed to send system message:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Task completion requested successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error requesting task completion:', error);
    return NextResponse.json({ error: 'Failed to request task completion' }, { status: 500 });
  }
}
