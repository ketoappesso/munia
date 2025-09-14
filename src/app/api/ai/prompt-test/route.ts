import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { systemPrompt, testMessage } = await request.json();

    if (!systemPrompt || !testMessage) {
      return NextResponse.json({ error: 'System prompt and test message are required' }, { status: 400 });
    }

    // Check if user is punked (has AI features)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { punked: true, phoneNumber: true }
    });

    if (!user?.punked) {
      return NextResponse.json({ error: 'AI features not available for this account' }, { status: 403 });
    }

    // Call DeepSeek API using LLM configuration
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    
    if (!apiKey) {
      console.error('LLM API key not configured');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    console.log('Testing prompt with DeepSeek API:', {
      apiUrl,
      model: process.env.LLM_MODEL || 'deepseek-chat',
      hasApiKey: !!apiKey,
      messageLength: testMessage.length,
      promptLength: systemPrompt.length
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: testMessage
          }
        ],
        max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Parse error message if possible
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json({ 
          error: errorJson.error?.message || errorJson.message || 'AI服务暂时不可用' 
        }, { status: response.status });
      } catch {
        return NextResponse.json({ 
          error: '无法连接到AI服务，请稍后重试' 
        }, { status: 500 });
      }
    }

    const data = await response.json();
    console.log('LLM API response received:', {
      hasChoices: !!data.choices,
      choicesCount: data.choices?.length,
      tokensUsed: data.usage?.total_tokens
    });
    
    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({ 
      response: aiResponse,
      model: process.env.LLM_MODEL || 'deepseek-chat',
      tokensUsed: data.usage?.total_tokens || 0
    });
  } catch (error) {
    console.error('Error testing prompt:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '测试失败，请检查网络连接' 
    }, { status: 500 });
  }
}