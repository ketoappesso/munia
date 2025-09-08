import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

// Test configuration
const TEST_TEXT = '你好，这是火山引擎TTS测试。今天天气很好！';
const API_URL = 'http://localhost:3002/api/tts/synthesize';

async function testVolcengineTTS() {
  console.log('🎤 Testing Volcengine TTS Integration');
  console.log('=====================================\n');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   App ID: ${process.env.VOLCENGINE_TTS_APP_ID || 'Not set'}`);
  console.log(`   Access Token: ${process.env.VOLCENGINE_TTS_ACCESS_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Secret Key: ${process.env.VOLCENGINE_TTS_SECRET_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Cluster: ${process.env.VOLCENGINE_TTS_CLUSTER || 'Not set'}\n`);
  
  try {
    // First, check if the API endpoint is available
    console.log('🔍 Checking TTS API status...');
    const statusRes = await fetch('http://localhost:3002/api/tts/synthesize', {
      method: 'GET',
    });
    
    if (statusRes.ok) {
      const status = await statusRes.json();
      console.log('✅ TTS API is available');
      console.log(`   Configured: ${status.configured ? '✅' : '❌'}`);
      console.log(`   Available voices: ${status.voices?.join(', ') || 'None'}\n`);
    }
    
    // Now test synthesis
    console.log(`📝 Test text: "${TEST_TEXT}"`);
    console.log('🎯 Requesting TTS synthesis...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, this would need authentication
      },
      body: JSON.stringify({
        text: TEST_TEXT,
        voice: 'BV001', // Chinese female voice
        speed: 1.0,
        volume: 1.0,
        pitch: 1.0,
        encoding: 'mp3',
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ TTS API Error:', result.error);
      if (result.fallback) {
        console.log('ℹ️  Service not configured - would fall back to browser TTS');
      }
      return;
    }
    
    if (result.success) {
      console.log('✅ TTS synthesis successful!');
      console.log(`   Cached: ${result.cached ? 'Yes' : 'No'}`);
      console.log(`   Estimated duration: ${result.duration || 'N/A'} seconds`);
      console.log(`   Audio data size: ${result.audio.length} characters (base64)`);
      
      // Save audio file for testing
      const audioBuffer = Buffer.from(result.audio, 'base64');
      const outputPath = join(__dirname, 'test-tts-output.mp3');
      await fs.writeFile(outputPath, audioBuffer);
      console.log(`\n💾 Audio saved to: ${outputPath}`);
      console.log('🎵 You can play this file to verify the TTS output');
      
    } else {
      console.error('❌ TTS synthesis failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Make sure the development server is running on port 3002');
    }
  }
}

// Run the test
testVolcengineTTS().catch(console.error);