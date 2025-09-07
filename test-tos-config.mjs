#!/usr/bin/env node

// Test TOS configuration
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
config({ path: '.env.local' });

console.log('🔍 Testing TOS Configuration...\n');

const requiredVars = [
  'TOS_ACCESS_KEY',
  'TOS_SECRET_KEY', 
  'TOS_ENDPOINT',
  'TOS_BUCKET_NAME',
  'TOS_REGION'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value.slice(0, 4)}...)`);
  } else {
    console.log(`❌ ${varName}: Not set`);
    allConfigured = false;
  }
});

if (!allConfigured) {
  console.log('\n❌ TOS configuration incomplete!');
  console.log('\nPlease configure the following in .env.local:');
  console.log('TOS_ACCESS_KEY=your_access_key');
  console.log('TOS_SECRET_KEY=your_secret_key');
  console.log('TOS_ENDPOINT=tos-cn-guangzhou.volces.com'); 
  console.log('TOS_BUCKET_NAME=xiaoyuan-chat');
  console.log('TOS_REGION=cn-guangzhou');
} else {
  console.log('\n✅ TOS configuration looks good!');
  
  // Test the URL construction
  const bucket = process.env.TOS_BUCKET_NAME;
  const endpoint = process.env.TOS_ENDPOINT;
  const testFileName = 'chat-media/test-image.jpg';
  const expectedUrl = `https://${bucket}.${endpoint}/${testFileName}`;
  
  console.log(`\n🔗 Test URL: ${expectedUrl}`);
}

console.log('\n📋 Next.js image domains configuration:');
try {
  const nextConfigPath = resolve('next.config.js');
  const nextConfig = readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfig.includes('xiaoyuan-chat.tos-cn-guangzhou.volces.com')) {
    console.log('✅ TOS domain configured in next.config.js');
  } else {
    console.log('❌ TOS domain missing in next.config.js');
  }
} catch (err) {
  console.log('⚠️  Could not read next.config.js');
}