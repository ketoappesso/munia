/**
 * POST /api/conversations/task-group
 * - Creates a three-way conversation for task collaboration
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

const APPESSO_BOT_ID = 'appesso-assistant'; // Special ID for the Appesso assistant

export async function POST(request: NextRequest) {
  try {
    const [user] = await getServerUser();
    if (!user) return NextResponse.json({}, { status: 401 });

    const { taskId, taskOwnerId, acceptorId, rewardAmount } = await request.json();

    // Verify the task exists
    const task = await prisma.post.findUnique({
      where: { id: taskId },
      include: { user: true },
    });

    if (!task || !task.isTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get task owner and acceptor info
    const [taskOwner, acceptor] = await Promise.all([
      prisma.user.findUnique({ where: { id: taskOwnerId } }),
      prisma.user.findUnique({ where: { id: acceptorId } }),
    ]);

    if (!taskOwner || !acceptor) {
      return NextResponse.json({ error: 'Users not found' }, { status: 404 });
    }

    // Check if Appesso assistant exists, if not create it
    let appessoBot = await prisma.user.findUnique({
      where: { id: APPESSO_BOT_ID },
    });

    if (!appessoBot) {
      appessoBot = await prisma.user.create({
        data: {
          id: APPESSO_BOT_ID,
          username: 'appesso_assistant',
          name: '小助手',
          email: 'assistant@appesso.app',
          bio: '我是Appesso平台的智能助手，负责协助处理任务交接和纠纷处理。',
          profilePhoto: 'appesso-bot-avatar.png',
        },
      });
    }

    // Create a unique conversation ID
    const conversationId = `task-${taskId}-${Date.now()}`;

    // Create initial message from Appesso bot
    const initialMessage = `
🎯 **任务协作群聊已创建**

📋 **任务详情**
- 任务内容：${task.content}
- 悬赏金额：${rewardAmount} APE
- 发布者：@${taskOwner.username || taskOwner.phoneNumber}
- 揭榜者：@${acceptor.username || acceptor.phoneNumber}

📱 **联系方式**
- 发布者手机：${taskOwner.phoneNumber || '未提供'}
- 揭榜者手机：${acceptor.phoneNumber || '未提供'}

⚠️ **重要提示**
1. 佣金已由平台托管，任务完成后自动转账
2. 发布者有3日时间确认任务完成情况
3. 如有争议，我将协助处理

💰 **红包佣金**
发布者可通过下方红包按钮向揭榜者支付佣金。

祝合作愉快！🤝
    `;

    // Create conversation (using a simple message structure for now)
    // In a real implementation, you'd have a proper Conversation model
    const conversation = await prisma.message.create({
      data: {
        content: initialMessage,
        senderId: APPESSO_BOT_ID,
        receiverId: taskOwnerId, // This is simplified, real group chat needs proper modeling
        conversationId,
      },
    });

    // Send notification to both parties
    await Promise.all([
      prisma.activity.create({
        data: {
          type: 'TASK_GROUP_CREATED',
          sourceId: taskId,
          targetId: taskId,
          sourceUserId: APPESSO_BOT_ID,
          targetUserId: taskOwnerId,
        },
      }),
      prisma.activity.create({
        data: {
          type: 'TASK_GROUP_CREATED',
          sourceId: taskId,
          targetId: taskId,
          sourceUserId: APPESSO_BOT_ID,
          targetUserId: acceptorId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      conversationId,
      message: 'Task group conversation created successfully',
    });
  } catch (error) {
    console.error('Error creating task group:', error);
    return NextResponse.json({ error: 'Failed to create task group' }, { status: 500 });
  }
}
