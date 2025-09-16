#!/usr/bin/env node

const API_KEY = 'sk-27a35a1f353346f0882cdf0417e2d7de';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

async function testDeepSeekAPI() {
  console.log('Testing DeepSeek API connection...\n');
  console.log('Configuration:');
  console.log(`- API URL: ${API_URL}`);
  console.log(`- Model: ${MODEL}`);
  console.log(`- API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log('\n-------------------\n');

  const messages = [
    {
      role: 'system',
      content: '你是一个友好的AI助手。请用中文简洁地回复用户的消息。'
    },
    {
      role: 'user',
      content: '你好'
    }
  ];

  const requestBody = {
    model: MODEL,
    messages: messages,
    max_tokens: 500,
    temperature: 0.7,
    top_p: 0.9
  };

  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  console.log('\nSending request to DeepSeek API...\n');

  try {
    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const elapsed = Date.now() - startTime;
    console.log(`Response received in ${elapsed}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error Response:');
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Success! API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n📝 AI Reply:');
      console.log(data.choices[0].message.content);
    }

    if (data.usage) {
      console.log('\n📊 Token Usage:');
      console.log(`- Prompt tokens: ${data.usage.prompt_tokens}`);
      console.log(`- Completion tokens: ${data.usage.completion_tokens}`);
      console.log(`- Total tokens: ${data.usage.total_tokens}`);
    }

  } catch (error) {
    console.error('\n❌ Request failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test different scenarios
async function testMultipleScenarios() {
  console.log('=== SCENARIO 1: Basic greeting ===\n');
  await testDeepSeekAPI();

  console.log('\n\n=== SCENARIO 2: Testing with actual user message ===\n');

  const messages2 = [
    {
      role: 'system',
      content: '你是一个智能助手。你友好、专业、乐于助人。\n你的回复简洁明了，富有个性。你会根据对话内容提供有价值的回应。\n\n请以自然、友好的方式回复用户的消息。\n\n重要规则：\n1. 保持回复简洁，通常不超过100字\n2. 使用自然的对话语气\n3. 根据上下文提供相关回应\n4. 可以使用表情符号增加亲和力'
    },
    {
      role: 'user',
      content: '今天天气怎么样'
    }
  ];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages2,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:', data.choices[0].message.content);
    } else {
      console.error('❌ Failed:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the tests
testMultipleScenarios().then(() => {
  console.log('\n\n=== Test completed ===');
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});