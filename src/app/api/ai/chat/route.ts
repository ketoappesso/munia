import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

// Simple AI responses for demonstration
// You can integrate with actual AI services like OpenAI, Claude, etc.
const generateAIResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Simple keyword-based responses
  if (lowerMessage.includes('你好') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return '你好！很高兴见到你。今天有什么可以帮助你的吗？';
  }
  
  if (lowerMessage.includes('天气')) {
    return '抱歉，我目前无法提供实时天气信息。建议你查看天气预报应用或网站获取最新的天气信息。';
  }
  
  if (lowerMessage.includes('时间') || lowerMessage.includes('几点')) {
    const now = new Date();
    return `现在是 ${now.toLocaleString('zh-CN')}`;
  }
  
  if (lowerMessage.includes('帮我写') || lowerMessage.includes('写一')) {
    if (lowerMessage.includes('总结')) {
      return `以下是一份工作总结模板：

# 工作总结

## 一、工作概述
本期完成了以下主要工作任务...

## 二、主要成果
1. 成功完成了XX项目的开发
2. 优化了系统性能，提升了XX%
3. 解决了XX个关键问题

## 三、经验总结
通过本期工作，获得了以下经验...

## 四、下期计划
1. 继续推进XX项目
2. 学习新技术XX
3. 改进工作流程

请根据你的实际情况修改和补充。`;
    }
    
    if (lowerMessage.includes('代码')) {
      return `请告诉我你需要什么样的代码？比如：
- 编程语言（Python, JavaScript, Java等）
- 功能需求（排序算法、API调用、数据处理等）
- 具体的使用场景

这样我可以为你提供更准确的代码示例。`;
    }
  }
  
  if (lowerMessage.includes('翻译')) {
    if (lowerMessage.includes('英文')) {
      // Extract text after '翻译成英文：' or similar patterns
      const textMatch = message.match(/翻译(?:成英文)?[：:]\s*(.+)/);
      if (textMatch) {
        // Simple translation examples (in real app, use translation API)
        const text = textMatch[1];
        if (text.includes('你好')) return 'Translation: Hello';
        if (text.includes('谢谢')) return 'Translation: Thank you';
        return `Translation of "${text}": [Please use a professional translation service for accurate results]`;
      }
      return '请提供需要翻译的内容，例如："翻译成英文：你好世界"';
    }
  }
  
  if (lowerMessage.includes('解释')) {
    const conceptMatch = message.match(/解释(?:一下)?(?:这个)?(?:概念)?[：:]\s*(.+)/);
    if (conceptMatch) {
      const concept = conceptMatch[1];
      return `关于"${concept}"的解释：

这是一个很好的问题。"${concept}"是一个重要的概念。

由于我是一个简单的演示AI，建议你：
1. 查阅相关的专业资料
2. 咨询领域专家
3. 在学习平台上搜索相关课程

这样可以获得更准确和深入的理解。`;
    }
    return '请告诉我你想了解哪个概念，我会尽力为你解释。';
  }
  
  if (lowerMessage.includes('谢谢') || lowerMessage.includes('thanks')) {
    return '不客气！很高兴能帮助到你。还有其他问题吗？';
  }
  
  if (lowerMessage.includes('再见') || lowerMessage.includes('bye')) {
    return '再见！祝你有美好的一天！随时欢迎回来。';
  }
  
  // Default response
  return `我理解你说的"${message}"。作为一个AI助手，我可以帮你：
  
1. 📝 写作协助 - 帮你写总结、报告、文章等
2. 💡 概念解释 - 解释各种概念和术语
3. 🌐 文本翻译 - 帮助翻译文本
4. 💻 编程帮助 - 提供代码示例和编程建议
5. 💬 日常对话 - 陪你聊天解闷

请告诉我具体需要什么帮助？`;
};

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Generate AI response
    const response = generateAIResponse(message);

    // If conversationId is provided, save to conversation messages
    if (conversationId) {
      try {
        // Save user message
        await prisma.message.create({
          data: {
            content: message,
            senderId: session.user.id!,
            conversationId: conversationId,
            type: 'TEXT',
          },
        });

        // Save AI response
        await prisma.message.create({
          data: {
            content: response,
            senderId: 'ai-user-001', // AI user ID
            conversationId: conversationId,
            type: 'TEXT',
          },
        });

        // Update conversation's last message timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });
      } catch (error) {
        console.error('Error saving AI conversation:', error);
        // Continue anyway, just log the error
      }
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
