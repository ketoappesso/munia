const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// API配置
const API_CONFIG = {
  appId: '7820115171',
  accessKey: 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-',
  resourceId: 'volc.service_type.10029', // BigTTS resource ID
  endpoint: 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
};

// 测试确认可用的语音
const testVoices = [
  'zh_female_shuangkuaisisi_moon_bigtts',  // 女声
  'zh_male_ahu_conversation_wvae_bigtts',   // 男声
  'S_r3YGBCoB1',  // 自定义语音测试
];

async function testVoice(voiceId) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const isCustomVoice = voiceId.startsWith('S_');
    const resourceId = isCustomVoice ? 'volc.megatts.default' : API_CONFIG.resourceId;
    
    const requestBody = JSON.stringify({
      user: {
        uid: 'test-user-123'
      },
      req_params: {
        text: '你好，这是火山引擎语音合成测试',
        speaker: voiceId,
        audio_params: {
          format: 'mp3',
          sample_rate: 24000,
          speech_rate: 0
        }
      }
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-App-Id': API_CONFIG.appId,
        'X-Api-Access-Key': API_CONFIG.accessKey,
        'X-Api-Resource-Id': resourceId,
        'X-Api-Request-Id': requestId,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const url = new URL(API_CONFIG.endpoint);
    options.hostname = url.hostname;
    options.path = url.pathname;
    options.port = 443;
    
    console.log(`\nTesting ${voiceId} (${isCustomVoice ? 'Custom' : 'Standard'} voice)`);
    console.log(`Using resource ID: ${resourceId}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // v3 API returns multiple JSON objects separated by newlines
          const jsonLines = data.split('\n').filter(line => line.trim());
          let audioData = '';
          let hasError = false;
          let errorMessage = '';
          
          for (const line of jsonLines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              
              if (response.code === 0 && response.data) {
                audioData += response.data;
              } else if (response.code === 20000000) {
                // Stream completed
              } else if (response.code !== 0 && response.code !== 20000000) {
                hasError = true;
                errorMessage = response.message || `Code ${response.code}`;
              }
            }
          }
          
          if (!hasError && audioData) {
            // Save audio file for testing
            const filename = `test-${voiceId.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
            const audioBuffer = Buffer.from(audioData, 'base64');
            fs.writeFileSync(filename, audioBuffer);
            
            console.log(`✅ SUCCESS - Audio saved to ${filename}`);
            console.log(`   File size: ${audioBuffer.length} bytes`);
            resolve({ voiceId, success: true, filename });
          } else {
            console.log(`❌ FAILED - ${errorMessage || 'No audio data'}`);
            resolve({ voiceId, success: false, error: errorMessage });
          }
        } catch (e) {
          console.log(`❌ Parse error - ${e.message}`);
          resolve({ voiceId, success: false, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Request error - ${e.message}`);
      resolve({ voiceId, success: false, error: e.message });
    });

    req.write(requestBody);
    req.end();
  });
}

async function main() {
  console.log('=== 火山引擎TTS v3 API 最终测试 ===');
  console.log('\n配置信息:');
  console.log(`App ID: ${API_CONFIG.appId}`);
  console.log(`BigTTS Resource ID: ${API_CONFIG.resourceId}`);
  console.log(`MegaTTS Resource ID: volc.megatts.default`);
  console.log(`Endpoint: ${API_CONFIG.endpoint}`);
  
  const results = [];
  
  for (const voice of testVoices) {
    const result = await testVoice(voice);
    results.push(result);
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n=== 测试结果汇总 ===');
  const successfulVoices = results.filter(r => r.success);
  const failedVoices = results.filter(r => !r.success);
  
  console.log(`\n✅ 成功的语音 (${successfulVoices.length}/${testVoices.length}):`)
  successfulVoices.forEach(v => {
    console.log(`  - ${v.voiceId}`);
    console.log(`    文件: ${v.filename}`);
  });
  
  if (failedVoices.length > 0) {
    console.log(`\n❌ 失败的语音 (${failedVoices.length}/${testVoices.length}):`)
    failedVoices.forEach(v => console.log(`  - ${v.voiceId}: ${v.error}`));
  }
  
  if (successfulVoices.length === testVoices.length) {
    console.log('\n🎉 所有语音测试通过！');
    console.log('标准语音可以正常使用，用户没有自定义语音时会使用标准语音。');
  }
}

main().catch(console.error);