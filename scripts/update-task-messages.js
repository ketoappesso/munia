const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTaskCompletionMessages() {
  try {
    // Find all system messages that are task completion requests
    const messages = await prisma.message.findMany({
      where: {
        type: 'SYSTEM',
        content: {
          contains: '任务完成申请已提交'
        }
      }
    });

    console.log(`Found ${messages.length} messages to update`);

    for (const message of messages) {
      // Extract the amount from the content if possible
      const amountMatch = message.content.match(/(\d+(?:\.\d+)?)\s*APE/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 10; // Default to 10 if not found

      // Update the message type and add task fields
      await prisma.message.update({
        where: { id: message.id },
        data: {
          type: 'TASK_COMPLETION_REQUEST',
          taskFinalAmount: amount,
          taskCompletionStatus: 'pending',
          // We can't determine the postId from the message alone, 
          // but for testing we'll use a placeholder
          taskPostId: 1
        }
      });

      console.log(`Updated message ${message.id}`);
    }

    console.log('All messages updated successfully');
  } catch (error) {
    console.error('Error updating messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTaskCompletionMessages();
