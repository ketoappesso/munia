const https = require('https');
const crypto = require('crypto');

// API配置
const API_CONFIG = {
  appId: '7820115171',
  accessKey: 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-',
  resourceId: 'volc.service_type.10029', // BigTTS resource ID
  endpoint: 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
};

// 测试更多可能的BigTTS声音
const testVoices = [
  // 女声 - 尝试带_bigtts后缀
  'zh_female_tianmei_bigtts',
  'zh_female_qingxin_bigtts',
  'zh_female_wanwan_bigtts',
  'zh_female_tingting_bigtts',
  'zh_female_yoyo_bigtts',
  'zh_female_xiaoxiao_bigtts',
  'zh_female_mengmeng_bigtts',
  'zh_female_jinjin_bigtts',
  'zh_female_yueyue_bigtts',
  'zh_female_lili_bigtts',
  
  // 男声 - 尝试带_bigtts后缀
  'zh_male_yangguang_bigtts',
  'zh_male_xuanxuan_bigtts',
  'zh_male_haohao_bigtts',
  'zh_male_mingming_bigtts',
  'zh_male_xiaojun_bigtts',
  'zh_male_dada_bigtts',
  'zh_male_dongdong_bigtts',
  'zh_male_baba_bigtts',
  'zh_male_laoban_bigtts',
  'zh_male_xiaoyu_bigtts',
  
  // 其他可能的格式
  'zh_female_shuangkuai_bigtts',
  'zh_female_shuangkuaisi_bigtts',
  'zh_male_ahu_bigtts',
  'zh_male_lazy_bigtts',
  'zh_male_lazyyang_bigtts',
  
  // 特殊风格
  'zh_female_sweet_bigtts',
  'zh_female_cute_bigtts', 
  'zh_female_professional_bigtts',
  'zh_male_storyteller_bigtts',
  'zh_male_news_bigtts',
  'zh_male_professional_bigtts',
  
  // 方言尝试
  'zh_female_guangdong_bigtts',
  'zh_female_sichuan_bigtts',
  'zh_male_beijing_bigtts',
  'zh_male_shanghai_bigtts',
];

async function testVoice(voiceId) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const requestBody = JSON.stringify({
      user: {
        uid: 'test-user-123'
      },
      req_params: {
        text: '你好，这是测试语音',
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
        'X-Api-Resource-Id': API_CONFIG.resourceId,
        'X-Api-Request-Id': requestId,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const url = new URL(API_CONFIG.endpoint);
    options.hostname = url.hostname;
    options.path = url.pathname;
    options.port = 443;
    
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
          let hasData = false;
          let errorMessage = '';
          
          for (const line of jsonLines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              if (response.code === 0) {
                if (response.data) {
                  hasData = true;
                }
              } else if (response.code === 20000000) {
                hasSuccess = true;
              } else {
                errorMessage = response.message || `Code ${response.code}`;
              }
            }
          }
          
          if (hasSuccess && hasData) {
            console.log(`✅ ${voiceId}: SUCCESS`);
            resolve({ voiceId, success: true });
          } else if (errorMessage) {
            console.log(`❌ ${voiceId}: ${errorMessage}`);
            resolve({ voiceId, success: false, error: errorMessage });
          } else {
            console.log(`❌ ${voiceId}: No data received`);
            resolve({ voiceId, success: false, error: 'No data' });
          }
        } catch (e) {
          console.log(`❌ ${voiceId}: Parse error - ${e.message}`);
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
  console.log('=== 搜索更多火山引擎BigTTS标准语音 ===\n');
  console.log('配置信息:');
  console.log(`App ID: ${API_CONFIG.appId}`);
  console.log(`Resource ID: ${API_CONFIG.resourceId} (BigTTS)`);
  console.log(`Endpoint: ${API_CONFIG.endpoint}\n`);
  
  const results = [];
  
  for (const voice of testVoices) {
    await testVoice(voice).then(result => results.push(result));
    // 避免请求过快
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n=== 测试结果汇总 ===');
  const successfulVoices = results.filter(r => r.success);
  const failedVoices = results.filter(r => !r.success);
  
  console.log(`\n✅ 成功的语音 (${successfulVoices.length}):`)
  if (successfulVoices.length > 0) {
    successfulVoices.forEach(v => console.log(`  - ${v.voiceId}`));
  } else {
    console.log('  （无）');
  }
  
  console.log(`\n❌ 失败的语音 (${failedVoices.length}):`)
  // 只显示前10个失败的
  const displayFailed = failedVoices.slice(0, 10);
  displayFailed.forEach(v => console.log(`  - ${v.voiceId}`));
  if (failedVoices.length > 10) {
    console.log(`  ... 还有 ${failedVoices.length - 10} 个失败的语音`);
  }
  
  if (successfulVoices.length > 0) {
    console.log('\n发现的新语音可以添加到 voiceMapping.ts 中！');
  }
}

main().catch(console.error);