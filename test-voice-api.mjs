#!/usr/bin/env node

async function testVoiceAPI() {
  console.log('Testing Voice API with custom voice S_r3YGBCoB1...\n');

  const payload = {
    text: '月湖店挺舒服，推荐大家来体验。',
    voice: 'S_r3YGBCoB1', // Custom voice for 18874748888
    speed: 1.0,
    volume: 1.0,
    pitch: 1.0,
    encoding: 'mp3'
  };

  try {
    const response = await fetch('http://localhost:3002/api/tts/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.success && result.audio) {
      console.log('✅ Custom voice synthesis successful!');
      console.log('Response:', {
        success: result.success,
        cached: result.cached,
        duration: result.duration,
        audioLength: result.audio.length
      });
    } else {
      console.error('❌ Voice synthesis failed:', result);
    }
  } catch (error) {
    console.error('❌ Error calling API:', error);
  }

  // Test standard voice for comparison
  console.log('\n\nTesting standard voice BV001...\n');
  
  const standardPayload = {
    text: '这是标准语音的测试。',
    voice: 'BV001',
    speed: 1.0,
    volume: 1.0,
    pitch: 1.0,
    encoding: 'mp3'
  };

  try {
    const response = await fetch('http://localhost:3002/api/tts/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(standardPayload)
    });

    const result = await response.json();
    
    if (result.success && result.audio) {
      console.log('✅ Standard voice synthesis successful!');
      console.log('Response:', {
        success: result.success,
        cached: result.cached,
        duration: result.duration,
        audioLength: result.audio.length
      });
    } else {
      console.error('❌ Voice synthesis failed:', result);
    }
  } catch (error) {
    console.error('❌ Error calling API:', error);
  }
}

testVoiceAPI();