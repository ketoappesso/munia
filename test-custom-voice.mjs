#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test custom voice synthesis with the new credentials
const CUSTOM_VOICE_APP_ID = '7820115171';
const CUSTOM_VOICE_ACCESS_TOKEN = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';
const API_URL = 'https://openspeech.bytedance.com/api/v1/tts';

async function testCustomVoice() {
  console.log('Testing custom voice synthesis with new credentials...\n');
  
  const payload = {
    app: {
      appid: CUSTOM_VOICE_APP_ID,
      token: 'access_token',
      cluster: 'volcano_icl'
    },
    user: {
      uid: 'uid123'
    },
    audio: {
      voice_type: 'S_r3YGBCoB1', // Custom voice for 18874748888
      encoding: 'mp3',
      speed_ratio: 1.0
    },
    request: {
      reqid: Date.now().toString(),
      text: '月湖店挺舒服，推荐大家来体验。',
      operation: 'query'
    }
  };
  
  console.log('Request payload:', JSON.stringify(payload, null, 2));
  console.log('\nMaking API request...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${CUSTOM_VOICE_ACCESS_TOKEN}`,
        'X-Api-Resource-Id': 'volc.megatts.default'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.code === 3000 && result.data) {
      // Save audio file
      const audioBuffer = Buffer.from(result.data, 'base64');
      const outputPath = path.join(process.cwd(), 'test-custom-voice.mp3');
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`\n✅ Success! Audio saved to: ${outputPath}`);
      console.log('You can play it with: afplay test-custom-voice.mp3');
    } else {
      console.error('\n❌ Failed to synthesize voice:', result.Message || result);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Test standard voice for comparison
async function testStandardVoice() {
  console.log('\n\nTesting standard voice synthesis...\n');
  
  const ACCESS_TOKEN = 'QXlNWJpa1Jm80W6Ocdr71N-6bRmnzTVw';
  const V2_API_URL = 'https://openspeech.bytedance.com/api/v2/tts';
  
  const payload = {
    app: {
      appid: '6704779984',
      token: 'access_token',
      cluster: 'volcano_icl'
    },
    user: {
      uid: 'appesso-user-001'
    },
    audio: {
      voice_type: 'BV001_streaming',
      encoding: 'mp3',
      speed_ratio: 1.0,
      volume_ratio: 1.0,
      pitch_ratio: 1.0
    },
    request: {
      reqid: Date.now().toString(),
      text: '这是标准语音的测试。',
      text_type: 'plain',
      operation: 'query',
      with_frontend: 1,
      frontend_type: 'unitTson'
    }
  };
  
  console.log('Request payload:', JSON.stringify(payload, null, 2));
  console.log('\nMaking API request...');
  
  try {
    const response = await fetch(V2_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${ACCESS_TOKEN}`,
        'X-Api-Resource-Id': 'volc.service_type.10029'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if ((result.code === 0 || result.code === 3000) && result.data) {
      // Save audio file
      const audioBuffer = Buffer.from(result.data, 'base64');
      const outputPath = path.join(process.cwd(), 'test-standard-voice.mp3');
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`\n✅ Success! Audio saved to: ${outputPath}`);
      console.log('You can play it with: afplay test-standard-voice.mp3');
    } else {
      console.error('\n❌ Failed to synthesize voice:', result.Message || result);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run both tests
async function main() {
  await testCustomVoice();
  await testStandardVoice();
}

main();