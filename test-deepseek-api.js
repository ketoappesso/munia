#!/usr/bin/env node

// Test DeepSeek API Connection
const https = require('https');

// API Configuration from .env.local
const API_KEY = 'sk-27a35a1f353346f0882cdf0417e2d7de';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

console.log('🔍 Testing DeepSeek API Connection...\n');
console.log('Configuration:');
console.log('- API URL:', API_URL);
console.log('- Model:', MODEL);
console.log('- API Key:', API_KEY.substring(0, 10) + '...' + API_KEY.substring(API_KEY.length - 4));
console.log('\n-----------------------------------\n');

// Test message
const testMessage = {
  model: MODEL,
  messages: [
    {
      role: 'system',
      content: '你是一个友好的AI助手。请用中文回复。'
    },
    {
      role: 'user',
      content: '你好！请简单介绍一下你自己，并告诉我现在的时间（用一句话回答即可）。'
    }
  ],
  max_tokens: 200,
  temperature: 0.7,
  top_p: 0.9
};

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
};

console.log('📤 Sending test request to DeepSeek API...\n');

const req = https.request(API_URL, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response Status:', res.statusCode, res.statusMessage);
    console.log('-----------------------------------\n');

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ API Connection Successful!\n');
        console.log('Response Details:');
        console.log('- Model Used:', response.model || MODEL);
        console.log('- Response ID:', response.id);
        console.log('- Created:', new Date(response.created * 1000).toLocaleString());

        if (response.choices && response.choices[0]) {
          console.log('\n🤖 AI Response:');
          console.log(response.choices[0].message.content);
        }

        if (response.usage) {
          console.log('\n📊 Token Usage:');
          console.log('- Prompt Tokens:', response.usage.prompt_tokens);
          console.log('- Completion Tokens:', response.usage.completion_tokens);
          console.log('- Total Tokens:', response.usage.total_tokens);
        }

        console.log('\n✨ DeepSeek API is working correctly!');
      } else {
        console.error('❌ API Error:', res.statusCode);
        console.error('Error Details:', JSON.stringify(response, null, 2));

        if (response.error) {
          console.error('\nError Message:', response.error.message || response.error);
          console.error('Error Type:', response.error.type || 'Unknown');
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError.message);
      console.error('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network Error:', error.message);
  console.error('\nPossible issues:');
  console.error('- Check your internet connection');
  console.error('- Verify the API endpoint is correct');
  console.error('- Check if DeepSeek service is available');
});

// Set timeout
req.setTimeout(30000, () => {
  console.error('❌ Request timeout after 30 seconds');
  req.destroy();
});

// Send the request
req.write(JSON.stringify(testMessage));
req.end();

console.log('⏳ Waiting for response (timeout: 30s)...\n');