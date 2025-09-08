#!/usr/bin/env node

// Test TTS API endpoint
async function testTTSAPI() {
  try {
    console.log('Testing TTS API...\n');
    
    // Test the status endpoint first
    console.log('1. Checking TTS service status...');
    const statusResponse = await fetch('http://localhost:3002/api/tts/synthesize', {
      method: 'GET',
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('TTS Service Status:', status);
    } else {
      console.log('Status check failed:', statusResponse.status);
    }
    
    // Test synthesis
    console.log('\n2. Testing TTS synthesis...');
    const testText = '你好，这是一个测试语音。';
    
    const response = await fetch('http://localhost:3002/api/tts/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testText,
        voice: 'BV001',
        speed: 1.0,
        volume: 1.0,
        pitch: 1.0,
        encoding: 'mp3'
      }),
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('\nAPI Response:', {
      success: result.success,
      hasAudio: !!result.audio,
      audioLength: result.audio ? result.audio.length : 0,
      cached: result.cached,
      duration: result.duration,
      error: result.error,
      fallback: result.fallback
    });
    
    if (result.audio) {
      console.log('\n✅ TTS synthesis successful!');
      console.log('Audio data received (base64 length):', result.audio.length);
    } else if (result.error) {
      console.log('\n❌ TTS synthesis failed:', result.error);
      if (result.fallback) {
        console.log('Fallback to browser TTS is available');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testTTSAPI();