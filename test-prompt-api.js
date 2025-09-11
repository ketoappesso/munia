// 测试提示词API的脚本
const https = require('https');

const API_KEY = 'sk-27a35a1f353346f0882cdf0417e2d7de';
const API_URL = 'https://api.deepseek.com';

const testPrompt = {
  model: 'deepseek-chat',
  messages: [
    {
      role: 'system',
      content: '你是一个友善、智慧的AI助理，总是乐于帮助用户解决问题。请用温和、专业的语调回答用户的问题。'
    },
    {
      role: 'user',
      content: '怎么学英语比较好？'
    }
  ],
  max_tokens: 500,
  temperature: 0.7,
  stream: false
};

const options = {
  hostname: 'api.deepseek.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
};

console.log('正在测试DeepSeek API...');
console.log('API URL:', API_URL);
console.log('测试消息:', testPrompt.messages[1].content);

const req = https.request(options, (res) => {
  let data = '';

  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('\n✅ API测试成功！');
        console.log('AI回复:', response.choices[0].message.content);
        console.log('使用的tokens:', response.usage?.total_tokens);
      } else {
        console.log('\n❌ API返回错误:');
        console.log(response);
      }
    } catch (e) {
      console.log('\n❌ 解析响应失败:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ 请求失败:', error);
});

req.write(JSON.stringify(testPrompt));
req.end();