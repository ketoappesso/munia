import fs from 'fs';

// Test various text patterns to identify what causes custom voice failures
const testTexts = [
  // Known working
  "你好，这是自定义语音测试。",
  "我是猿素大师兄。",
  
  // Known failing
  "不停的测试，再测试，字体出不出来？",
  
  // Test individual components of failing text
  "不停的测试",
  "再测试",
  "字体出不出来",
  "字体",
  "出不出来",
  "？",
  
  // Test punctuation
  "测试句号。",
  "测试问号？",
  "测试逗号，继续",
  "测试感叹号！",
  
  // Test specific characters that might be problematic
  "停",
  "不停",
  "的",
  "再",
  "体",
  "字体",
  "出",
  "来",
  "不出来",
  "出不出来",
  
  // Test different sentence structures
  "这是一个测试",
  "这是测试",
  "测试测试",
  "继续测试",
  "开始测试",
  
  // More complex sentences
  "今天天气真好",
  "我想去散步",
  "这个功能很有用",
  "请检查一下",
  "能不能正常工作",
  
  // Test with numbers and mixed content
  "测试123",
  "第一次测试",
  "2024年的测试",
];

async function testVoice(text) {
  try {
    const response = await fetch('http://localhost:3002/api/tts/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: 'S_r3YGBCoB1',
        speed: 1.1,
        volume: 1.0,
        pitch: 1.0,
        encoding: 'mp3',
      }),
    });

    const result = await response.json();
    
    if (!result.success || !result.audio) {
      return { text, status: 'API_FAILED', error: result.error };
    }

    // Check if audio is silence pattern
    const isSilence = result.audio.substring(0, 50) === '//PkxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    
    // Decode and check audio size
    const audioBuffer = Buffer.from(result.audio, 'base64');
    
    // More detailed analysis
    let nonZeroBytes = 0;
    for (let i = 100; i < Math.min(audioBuffer.length, 1000); i++) {
      if (audioBuffer[i] !== 0x00 && audioBuffer[i] !== 0xFF) {
        nonZeroBytes++;
      }
    }
    
    const audioQuality = nonZeroBytes > 100 ? 'GOOD' : (nonZeroBytes > 10 ? 'POOR' : 'SILENT');
    
    return {
      text,
      status: isSilence ? 'SILENT' : 'SUCCESS',
      audioSize: audioBuffer.length,
      audioQuality,
      nonZeroBytes,
      preview: result.audio.substring(0, 30),
    };
    
  } catch (error) {
    return { text, status: 'ERROR', error: error.message };
  }
}

async function runTests() {
  console.log('Starting Custom Voice Compatibility Test');
  console.log('Voice ID: S_r3YGBCoB1');
  console.log('Testing', testTexts.length, 'different text samples...\n');
  
  const results = [];
  
  for (const text of testTexts) {
    process.stdout.write(`Testing: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" ... `);
    const result = await testVoice(text);
    results.push(result);
    
    if (result.status === 'SUCCESS' && result.audioQuality === 'GOOD') {
      console.log('✅ SUCCESS (Good audio)');
    } else if (result.status === 'SUCCESS' && result.audioQuality === 'POOR') {
      console.log('⚠️  SUCCESS (Poor audio)');
    } else if (result.status === 'SILENT') {
      console.log('❌ SILENT');
    } else {
      console.log('❌ FAILED:', result.error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Analyze results
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS RESULTS');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'SUCCESS' && r.audioQuality === 'GOOD');
  const poor = results.filter(r => r.status === 'SUCCESS' && r.audioQuality === 'POOR');
  const silent = results.filter(r => r.status === 'SILENT');
  const failed = results.filter(r => r.status === 'ERROR' || r.status === 'API_FAILED');
  
  console.log(`\n✅ Successful (Good Audio): ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   - "${r.text}"`));
  
  console.log(`\n⚠️  Poor Audio Quality: ${poor.length}/${results.length}`);
  poor.forEach(r => console.log(`   - "${r.text}" (${r.nonZeroBytes} non-zero bytes)`));
  
  console.log(`\n❌ Silent Audio: ${silent.length}/${results.length}`);
  silent.forEach(r => console.log(`   - "${r.text}"`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Requests: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`   - "${r.text}": ${r.error}`));
  }
  
  // Pattern analysis
  console.log('\n' + '='.repeat(60));
  console.log('PATTERN ANALYSIS');
  console.log('='.repeat(60));
  
  // Check for problematic characters
  const problematicChars = new Set();
  silent.forEach(r => {
    for (const char of r.text) {
      // Check if this character appears in any successful text
      const inSuccessful = successful.some(s => s.text.includes(char));
      if (!inSuccessful) {
        problematicChars.add(char);
      }
    }
  });
  
  if (problematicChars.size > 0) {
    console.log('\nPotentially problematic characters not in successful texts:');
    console.log(Array.from(problematicChars).join(', '));
  }
  
  // Check for problematic patterns
  console.log('\nChecking for patterns...');
  
  // Check if question marks are problematic
  const withQuestionMark = results.filter(r => r.text.includes('？'));
  const questionMarkFails = withQuestionMark.filter(r => r.status === 'SILENT').length;
  if (questionMarkFails > 0) {
    console.log(`- Question marks (？): ${questionMarkFails}/${withQuestionMark.length} failed`);
  }
  
  // Check for specific word combinations
  const patterns = [
    '不停', '出不出来', '字体', '再测试', '的测试'
  ];
  
  patterns.forEach(pattern => {
    const withPattern = results.filter(r => r.text.includes(pattern));
    const patternFails = withPattern.filter(r => r.status === 'SILENT').length;
    if (patternFails > 0) {
      console.log(`- Pattern "${pattern}": ${patternFails}/${withPattern.length} failed`);
    }
  });
  
  // Save detailed results to file
  const report = {
    timestamp: new Date().toISOString(),
    voiceId: 'S_r3YGBCoB1',
    totalTests: results.length,
    summary: {
      successful: successful.length,
      poorQuality: poor.length,
      silent: silent.length,
      failed: failed.length,
    },
    detailedResults: results,
    problematicCharacters: Array.from(problematicChars),
  };
  
  fs.writeFileSync('voice-compatibility-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: voice-compatibility-report.json');
}

// Run the tests
console.log('Make sure the development server is running on port 3002\n');
runTests().catch(console.error);