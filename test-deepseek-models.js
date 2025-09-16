#!/usr/bin/env node

// Test available DeepSeek models
const https = require('https');

const API_KEY = 'sk-27a35a1f353346f0882cdf0417e2d7de';

// Test different DeepSeek models
const modelsToTest = [
  'deepseek-chat',      // Default chat model
  'deepseek-coder',     // Code generation model
];

console.log('🔍 Testing DeepSeek Models...\n');

async function testModel(model) {
  return new Promise((resolve) => {
    const testMessage = {
      model: model,
      messages: [
        {
          role: 'user',
          content: '1+1=?'
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = https.request('https://api.deepseek.com/v1/chat/completions', options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${model}: Working`);
            console.log(`   Model ID: ${response.model}`);
            console.log(`   Response: ${response.choices[0]?.message?.content}\n`);
            resolve({ model, status: 'working', details: response.model });
          } else {
            console.log(`❌ ${model}: Error ${res.statusCode}`);
            if (response.error) {
              console.log(`   Error: ${response.error.message}\n`);
            }
            resolve({ model, status: 'error', error: response.error?.message });
          }
        } catch (e) {
          console.log(`❌ ${model}: Parse error\n`);
          resolve({ model, status: 'parse_error' });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${model}: Network error - ${error.message}\n`);
      resolve({ model, status: 'network_error' });
    });

    req.setTimeout(10000, () => {
      console.log(`❌ ${model}: Timeout\n`);
      req.destroy();
      resolve({ model, status: 'timeout' });
    });

    req.write(JSON.stringify(testMessage));
    req.end();
  });
}

// Test all models
(async () => {
  console.log('Testing models sequentially...\n');

  const results = [];
  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
  }

  console.log('-----------------------------------');
  console.log('Summary:');
  const working = results.filter(r => r.status === 'working');
  console.log(`✅ Working models: ${working.length}/${modelsToTest.length}`);

  if (working.length > 0) {
    console.log('\nRecommended model: deepseek-chat');
    console.log('This is the default and most suitable for general AI chat functionality.');
  }
})();