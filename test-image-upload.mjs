#!/usr/bin/env node

import { readFileSync, createReadStream } from 'fs';
import { resolve } from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

console.log('🧪 Testing Image Upload API...\n');

// Create a simple test image (1x1 pixel PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x00, 0x01, 0xA2, 0x5B, 0xC4, 0xE6, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

async function testUpload() {
  try {
    // Test the upload media endpoint
    console.log('📤 Testing /api/messages/upload-media...');
    
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });

    const response = await fetch('http://localhost:3002/api/messages/upload-media', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'authjs.session-token=test; authjs.csrf-token=test'
      }
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Upload test successful!');
      console.log('🔗 Generated URL:', data.mediaUrl);
      return true;
    } else {
      console.log('❌ Upload test failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

testUpload().then(success => {
  console.log('\n' + (success ? '✅ Image upload system ready!' : '❌ Image upload system needs fixing'));
});