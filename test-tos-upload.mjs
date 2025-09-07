#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('=== TOS Configuration Test ===\n');

// Check environment variables
const requiredEnvVars = [
  'TOS_ACCESS_KEY',
  'TOS_SECRET_KEY',
  'TOS_ENDPOINT',
  'TOS_BUCKET_NAME',
  'TOS_REGION'
];

console.log('1. Checking environment variables:');
let hasAllVars = true;
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value) {
    console.log(`   ❌ ${envVar}: NOT SET`);
    hasAllVars = false;
  } else if (envVar === 'TOS_ENDPOINT') {
    // Check for protocol prefix
    if (value.startsWith('http://') || value.startsWith('https://')) {
      console.log(`   ⚠️  ${envVar}: "${value}" (WARNING: Contains protocol prefix - should be domain only)`);
    } else {
      console.log(`   ✅ ${envVar}: "${value}"`);
    }
  } else if (envVar.includes('KEY')) {
    console.log(`   ✅ ${envVar}: ****${value.slice(-4)}`);
  } else {
    console.log(`   ✅ ${envVar}: "${value}"`);
  }
}

if (!hasAllVars) {
  console.log('\n❌ Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

console.log('\n2. Testing TOS connectivity:');

// Test creating the hostname
const endpoint = process.env.TOS_ENDPOINT;
const bucket = process.env.TOS_BUCKET_NAME;
const hostname = `${bucket}.${endpoint}`;
console.log(`   Hostname: ${hostname}`);

// Check if endpoint has protocol (it shouldn't)
if (endpoint.includes('://')) {
  console.log(`   ⚠️  WARNING: TOS_ENDPOINT contains protocol. It should be just the domain.`);
  console.log(`   Example: "tos-cn-guangzhou.volces.com" NOT "https://tos-cn-guangzhou.volces.com"`);
}

// Test DNS resolution
import { promises as dns } from 'dns';

try {
  const addresses = await dns.resolve4(hostname);
  console.log(`   ✅ DNS resolution successful: ${addresses[0]}`);
} catch (error) {
  console.log(`   ❌ DNS resolution failed for ${hostname}`);
  console.log(`      Error: ${error.message}`);
}

console.log('\n3. Testing HTTPS connectivity:');

// Test HTTPS connection
import https from 'https';

const testConnection = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ HTTPS connection successful (Status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`   ❌ HTTPS connection failed`);
      console.log(`      Error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ❌ HTTPS connection timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

await testConnection();

console.log('\n4. Testing with custom TOS client:');

// Import and test the custom TOS client
try {
  // Dynamic import to handle potential errors
  const { customTosClient } = await import('./src/lib/tos/customTosClient.js').catch(err => {
    console.log(`   ❌ Failed to import customTosClient: ${err.message}`);
    return { customTosClient: null };
  });

  if (customTosClient) {
    console.log(`   ✅ Custom TOS client loaded successfully`);
    
    // Try a simple upload test
    console.log('\n5. Testing upload functionality:');
    const testBuffer = Buffer.from('Test content for TOS upload');
    const testKey = `test-${Date.now()}.txt`;
    
    try {
      const result = await customTosClient.putObject({
        key: testKey,
        body: testBuffer,
        contentType: 'text/plain'
      });
      console.log(`   ✅ Test upload successful!`);
      console.log(`      Status: ${result.statusCode}`);
      console.log(`      Request ID: ${result.requestId}`);
      console.log(`      Test file URL: https://${hostname}/${testKey}`);
    } catch (error) {
      console.log(`   ❌ Test upload failed`);
      console.log(`      Error: ${error.message}`);
      
      // Check if it's a protocol error
      if (error.message.includes('Protocol') || error.message.includes('http:')) {
        console.log('\n   ⚠️  This appears to be a protocol mismatch error.');
        console.log('   Please ensure TOS_ENDPOINT does not include http:// or https://');
      }
    }
  }
} catch (error) {
  console.log(`   ❌ Error during testing: ${error.message}`);
}

console.log('\n=== Test Complete ===\n');
console.log('If you see any errors above, please check:');
console.log('1. TOS_ENDPOINT should be domain only (e.g., "tos-cn-guangzhou.volces.com")');
console.log('2. All TOS environment variables are correctly set');
console.log('3. Your TOS bucket exists and has proper permissions');
console.log('4. Your network can reach the TOS endpoint');
