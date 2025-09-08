#!/usr/bin/env node

// Test to find available custom voice IDs

const CUSTOM_VOICE_APP_ID = '7820115171';
const CUSTOM_VOICE_ACCESS_TOKEN = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';

// Try different voice IDs
const voiceIds = [
  'S_m0aDPBWcxP', // Known working custom voice
  'S_4KYgWc6PMEI',
  'S_r3YGBCoB1',
  'S_jJF0xKVAP2Q',
  'BV001_streaming',
  'zh_male_qingxuan',
  'zh_female_qingxin'
];

async function testVoice(voiceId) {
  try {
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
        voice_type: voiceId,
        encoding: 'mp3',
        speed_ratio: 1.0
      },
      request: {
        reqid: `test-${Date.now()}`,
        text: '测试',
        operation: 'query'
      }
    };

    const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${CUSTOM_VOICE_ACCESS_TOKEN}`,
        'X-Api-Resource-Id': 'volc.megatts.default'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.code === 3000 && result.data) {
      console.log(`✅ ${voiceId}: Working`);
      return true;
    } else {
      console.log(`❌ ${voiceId}: ${result.Message || result.message || 'Failed'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${voiceId}: ${error.message}`);
    return false;
  }
}

async function findWorkingVoices() {
  console.log('Testing custom voice IDs...\n');
  
  const workingVoices = [];
  for (const voice of voiceIds) {
    const works = await testVoice(voice);
    if (works) {
      workingVoices.push(voice);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Working voices:', workingVoices);
}

findWorkingVoices();