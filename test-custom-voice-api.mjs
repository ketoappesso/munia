import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// API Configuration for custom voice
const CUSTOM_VOICE_APP_ID = '7820115171';
const CUSTOM_VOICE_ACCESS_TOKEN = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';
const VOLCENGINE_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts';

async function testCustomVoice() {
  console.log('Testing Volcengine TTS API with custom voice S_r3YGBCoB1...\n');
  
  const requestId = `test-${Date.now()}`;
  const testText = '你好，这是一个测试。';
  const customVoiceId = 'S_r3YGBCoB1';
  
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
      voice_type: customVoiceId,
      encoding: 'mp3',
      speed_ratio: 1.1
    },
    request: {
      reqid: requestId,
      text: testText,
      operation: 'query'
    }
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer;${CUSTOM_VOICE_ACCESS_TOKEN}`,
    'X-Api-Resource-Id': 'volc.megatts.default',
  };
  
  console.log('Request details:');
  console.log('URL:', VOLCENGINE_TTS_URL);
  console.log('Voice ID:', customVoiceId);
  console.log('Text:', testText);
  console.log('Headers:', headers);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\nSending request...\n');
  
  try {
    const response = await fetch(VOLCENGINE_TTS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('\nResponse body:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.code === 3000 && result.data) {
      console.log('\n✅ SUCCESS: API returned audio data');
      
      // Save audio to file
      const audioBuffer = Buffer.from(result.data, 'base64');
      const filename = `test-custom-voice-${Date.now()}.mp3`;
      fs.writeFileSync(filename, audioBuffer);
      console.log(`Audio saved to: ${filename}`);
      console.log(`File size: ${audioBuffer.length} bytes`);
      
      // Try to play the audio
      try {
        console.log('\nAttempting to play audio...');
        await execAsync(`afplay ${filename}`);
        console.log('Audio playback completed');
      } catch (playError) {
        console.log('Could not play audio automatically:', playError.message);
      }
      
      return true;
    } else {
      console.log('\n❌ ERROR: API did not return valid audio data');
      console.log('Error code:', result.code);
      console.log('Error message:', result.Message || result.message);
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR making API request:', error);
    return false;
  }
}

// Also test standard voice for comparison
async function testStandardVoice() {
  console.log('\n\n=== Testing Standard Voice for comparison ===\n');
  
  const STANDARD_VOICE_APP_ID = '4228648687';
  const STANDARD_VOICE_ACCESS_TOKEN = 'VhSkXqLCd1ZPs68O4Em2prHI3Xu7WYq9';
  
  const requestId = `test-standard-${Date.now()}`;
  const testText = '你好，这是标准语音测试。';
  
  const payload = {
    app: {
      appid: STANDARD_VOICE_APP_ID,
      token: 'access_token',
      cluster: 'volcano_tts',
    },
    user: {
      uid: 'appesso-user-001',
    },
    audio: {
      voice_type: 'BV005_streaming',
      encoding: 'mp3',
      speed: 1.1,
      volume: 1.0,
      pitch: 1.0,
    },
    request: {
      reqid: requestId,
      text: testText,
      text_type: 'plain',
      operation: 'query',
    },
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer;${STANDARD_VOICE_ACCESS_TOKEN}`,
  };
  
  console.log('Testing standard voice BV005_streaming...');
  
  try {
    const response = await fetch(VOLCENGINE_TTS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    
    if (result.code === 3000 && result.data) {
      console.log('✅ Standard voice SUCCESS');
      
      const audioBuffer = Buffer.from(result.data, 'base64');
      const filename = `test-standard-voice-${Date.now()}.mp3`;
      fs.writeFileSync(filename, audioBuffer);
      console.log(`Audio saved to: ${filename}`);
      
      return true;
    } else {
      console.log('❌ Standard voice ERROR:', result.code, result.Message);
      return false;
    }
  } catch (error) {
    console.error('❌ Standard voice request error:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== Volcengine TTS API Test ===\n');
  console.log('Testing custom voice S_r3YGBCoB1 for user 18874748888\n');
  
  const customResult = await testCustomVoice();
  const standardResult = await testStandardVoice();
  
  console.log('\n\n=== Test Summary ===');
  console.log('Custom Voice (S_r3YGBCoB1):', customResult ? '✅ WORKING' : '❌ FAILED');
  console.log('Standard Voice (BV005):', standardResult ? '✅ WORKING' : '❌ FAILED');
  
  if (!customResult && standardResult) {
    console.log('\n⚠️  Custom voice API is failing while standard voice works.');
    console.log('Possible issues:');
    console.log('1. Custom voice ID (S_r3YGBCoB1) might be invalid or expired');
    console.log('2. Custom voice credentials might be incorrect');
    console.log('3. The custom voice might not be accessible with current app ID');
  } else if (!customResult && !standardResult) {
    console.log('\n⚠️  Both APIs are failing. Check network connection and credentials.');
  }
}

runTests().catch(console.error);