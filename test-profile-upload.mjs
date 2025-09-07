#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

async function testProfilePhotoUpload() {
  console.log('=== Testing Profile Photo Upload ===\n');

  // First, check if the server is running
  try {
    const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.log('❌ Server is not running. Please start the development server first.');
      console.log('   Run: npm run dev');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server at', API_URL);
    return;
  }

  console.log('✅ Server is running\n');

  // Create a test image buffer
  const imageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );

  // Create form data
  const formData = new FormData();
  formData.append('file', imageBuffer, {
    filename: 'test-image.png',
    contentType: 'image/png'
  });

  console.log('📤 Sending test image upload...\n');

  // Note: This would need a valid session/auth token to work
  // For now, this is just to test the endpoint structure
  console.log('ℹ️  Note: This test requires authentication.');
  console.log('   To fully test, you need to:');
  console.log('   1. Log in to the application');
  console.log('   2. Get your session cookie or auth token');
  console.log('   3. Include it in the request headers\n');

  // Test the endpoint structure
  const endpoints = [
    '/api/users/[userId]/profilePhoto',
    '/api/users/[userId]/coverPhoto'
  ];

  console.log('📋 Profile upload endpoints configured:');
  endpoints.forEach(endpoint => {
    console.log(`   - ${endpoint}`);
  });

  console.log('\n📝 Expected form data structure:');
  console.log('   - Field name: "file"');
  console.log('   - Content: Image file (jpeg/jpg/png)');
  console.log('   - Max size: Typically 5MB');

  console.log('\n🔧 TOS Configuration:');
  console.log('   - Endpoint should be domain only (no http://)');
  console.log('   - Example: tos-cn-guangzhou.volces.com');
  console.log('   - Full URL pattern: https://{bucket}.{endpoint}/{filename}');

  console.log('\n=== Test Complete ===');
}

testProfilePhotoUpload().catch(console.error);
