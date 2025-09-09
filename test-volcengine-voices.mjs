#!/usr/bin/env node

// Test different voice IDs with Volcengine TTS

const voices = [
  'BV001',
  'BV001_streaming',
  'BV002',
  'BV002_streaming',
  'BV003',
  'BV700_V2_streaming',
  'BV701_V2_streaming',
  'BV406_V2_streaming',
  'BV406',
  'BV700',
  'zh_female_qingxin',
  'zh_male_wanwan',
];

async function testVoice(voiceId) {
  try {
    const payload = {
      app: {
        appid: '6704779984',
        token: 'access_token',
        cluster: 'volcano_icl',
      },
      user: {
        uid: 'appesso-user-001',
      },
      audio: {
        voice_type: voiceId,
        encoding: 'mp3',
        speed_ratio: 1.0,
        volume_ratio: 1.0,
        pitch_ratio: 1.0,
      },
      request: {
        reqid: `test-${Date.now()}`,
        text: '测试语音',
        text_type: 'plain',
        operation: 'query',
        with_frontend: 1,
        frontend_type: 'unitTson'
      },
    };

    const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer;QXlNWJpa1Jm80W6Ocdr71N-6bRmnzTVw',
        'X-Api-Resource-Id': 'volc.service_type.10029',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (result.code === 0 || result.code === 3000) {
      console.log(`✅ ${voiceId}: SUCCESS`);
    } else {
      console.log(`❌ ${voiceId}: ${result.message || 'Failed'}`);
    }
  } catch (error) {
    console.log(`❌ ${voiceId}: ${error.message}`);
  }
}

async function testAllVoices() {
  console.log('Testing Volcengine TTS Voices...\n');
  
  for (const voice of voices) {
    await testVoice(voice);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
}

testAllVoices();