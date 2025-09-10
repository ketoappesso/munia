const https = require('https');
const crypto = require('crypto');

// API配置
const API_CONFIG = {
  appId: '7820115171',
  accessKey: 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-',
  // 尝试不同的资源ID
  resourceIds: {
    'bigtts': 'volc.service_type.10029',  // 大模型语音合成（字符版）
    'megatts': 'volc.megatts.default',    // 声音复刻2.0（字符版）
    'bigtts_concurr': 'volc.service_type.10048', // 大模型语音合成（并发版）
  },
  endpoint: 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
};

// 测试多个可能的标准语音ID
const testVoices = [
  // 原有的BV系列
  'BV001_streaming',
  'BV002_streaming', 
  'BV003_streaming',
  'BV004_streaming',
  'BV005_streaming',
  // 文档中提到的示例
  'zh_female_shuangkuaisisi_moon_bigtts',
  'zh_male_bvlazysheep',
  'zh_male_ahu_conversation_wvae_bigtts',
  // 可能的其他格式
  'BV120_streaming',
  'BV200_streaming',
  // 尝试不同的命名格式
  'zh_female_tianmei',
  'zh_male_xuanxuan',
  'zh_female_qingxin',
  'zh_male_yangguang'
];

async function testVoice(voiceId, resourceId) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const requestBody = JSON.stringify({
      user: {
        uid: 'test-user-123'
      },
      req_params: {
        text: '测试语音',
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

    console.log(`Testing voice: ${voiceId}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // v3 API returns multiple JSON objects separated by newlines
          const jsonLines = data.split('\n').filter(line => line.trim());
          let hasSuccess = false;
          let errorMessage = '';
          
          for (const line of jsonLines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              if (response.code === 0 || response.code === 20000000) {
                hasSuccess = true;
              } else if (response.code !== 0 && response.code !== 20000000) {
                errorMessage = response.message || 'Unknown error';
              }
            }
          }
          
          if (hasSuccess) {
            console.log(`✅ ${voiceId}: SUCCESS`);
            resolve({ voiceId, success: true });
          } else {
            console.log(`❌ ${voiceId}: FAILED - ${errorMessage}`);
            resolve({ voiceId, success: false, error: errorMessage });
          }
        } catch (e) {
          console.log(`❌ ${voiceId}: Parse error - ${e.message}`);
          console.log(`Response data: ${data.substring(0, 200)}`);
          resolve({ voiceId, success: false, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${voiceId}: Request error - ${e.message}`);
      resolve({ voiceId, success: false, error: e.message });
    });

    req.write(requestBody);
    req.end();
  });
}

async function main() {
  console.log('=== 火山引擎TTS v3 API 语音测试 ===\n');
  console.log('配置信息:');
  console.log(`App ID: ${API_CONFIG.appId}`);
  console.log(`Resource IDs:`, API_CONFIG.resourceIds);
  console.log(`Endpoint: ${API_CONFIG.endpoint}\n`);
  
  const results = [];
  
  // 测试每个语音用不同的资源ID
  for (const voice of testVoices) {
    // 根据语音ID判断使用哪个资源ID
    let resourceId = API_CONFIG.resourceIds.megatts; // 默认使用声音复刻
    
    if (voice.includes('bigtts')) {
      resourceId = API_CONFIG.resourceIds.bigtts;
    } else if (voice.startsWith('BV')) {
      // BV系列可能是声音复刻
      resourceId = API_CONFIG.resourceIds.megatts;
    }
    
    console.log(`\nTrying ${voice} with resourceId: ${resourceId}`);
    const result = await testVoice(voice, resourceId);
    results.push(result);
    
    // 如果第一个资源ID失败，尝试其他的
    if (!result.success && resourceId !== API_CONFIG.resourceIds.bigtts) {
      console.log(`Retrying ${voice} with bigtts resourceId...`);
      const retryResult = await testVoice(voice, API_CONFIG.resourceIds.bigtts);
      if (retryResult.success) {
        results[results.length - 1] = retryResult;
      }
    }
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n=== 测试结果汇总 ===');
  const successfulVoices = results.filter(r => r.success);
  const failedVoices = results.filter(r => !r.success);
  
  console.log(`\n成功的语音 (${successfulVoices.length}):`);
  successfulVoices.forEach(v => console.log(`  - ${v.voiceId}`));
  
  console.log(`\n失败的语音 (${failedVoices.length}):`);
  failedVoices.forEach(v => console.log(`  - ${v.voiceId}: ${v.error}`));
  
  console.log('\n提示: 火山引擎可能有更多未公开的语音ID，建议查阅官方文档或联系技术支持获取完整列表。');
}

main().catch(console.error);