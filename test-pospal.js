#!/usr/bin/env node

/**
 * Test script for Pospal API connection
 * 
 * Usage: 
 * 1. First, set your API key in .env.local: POSPAL_ZD_APPKEY=your_actual_key
 * 2. Run: node test-pospal.js <phone_number>
 * 
 * The API key should be the same one used in your appesso-backend-server
 * Look for it in the backend server's environment variables as PASPAL_ZD
 */

const crypto = require('crypto');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POSPAL_BASE_URL = 'area20-win.pospal.cn';
const APP_ID = '425063AC22F21CCD8E293004DDD8DA95';
const APP_KEY = process.env.POSPAL_ZD_APPKEY;

if (!APP_KEY) {
  console.error('❌ POSPAL_ZD_APPKEY not found in .env.local');
  console.log('\n📝 To get the API key:');
  console.log('1. Check your appesso-backend-server environment variables');
  console.log('2. Look for a variable named PASPAL_ZD');
  console.log('3. Add it to .env.local as POSPAL_ZD_APPKEY=<your_key>');
  process.exit(1);
}

function generateSignature(payload) {
  const signatureBase = APP_KEY + JSON.stringify(payload);
  return crypto.createHash('md5').update(signatureBase, 'utf8').digest('hex').toUpperCase();
}

function makeRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const payloadWithAppId = { ...payload, appId: APP_ID };
    const signature = generateSignature(payloadWithAppId);
    const timestamp = Date.now().toString();
    const body = JSON.stringify(payloadWithAppId);

    const options = {
      hostname: POSPAL_BASE_URL,
      port: 443,
      path: `/pospal-api2/openapi/v1/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'time-stamp': timestamp,
        'data-signature': signature,
        'User-Agent': 'Munia/1.0',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'success') {
            resolve(result.data);
          } else {
            reject(new Error(`API Error: ${result.messages ? result.messages.join(', ') : 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function testConnection() {
  const phoneNumber = process.argv[2];
  
  if (!phoneNumber) {
    console.error('❌ Please provide a phone number as argument');
    console.log('Usage: node test-pospal.js <phone_number>');
    console.log('Example: node test-pospal.js 13812345678');
    process.exit(1);
  }

  console.log('🔍 Testing Pospal API connection...');
  console.log(`📱 Phone number: ${phoneNumber}`);
  console.log(`🏪 Store: 总店 (Main Store)`);
  console.log(`🆔 App ID: ${APP_ID}`);
  console.log(`🔑 API Key: ${APP_KEY.substring(0, 4)}...${APP_KEY.substring(APP_KEY.length - 4)}`);
  console.log('');

  try {
    console.log('📡 Querying customer by phone number...');
    const customers = await makeRequest('customerOpenapi/queryBytel', {
      customerTel: phoneNumber
    });

    if (customers && customers.length > 0) {
      const customer = customers[0];
      console.log('✅ Customer found!');
      console.log('');
      console.log('Customer Details:');
      console.log(`  Name: ${customer.name || 'N/A'}`);
      console.log(`  Member Number: ${customer.number || 'N/A'}`);
      console.log(`  Phone: ${customer.phone || phoneNumber}`);
      console.log(`  Main Balance: ¥${customer.balance || 0}`);
      console.log(`  Points: ${customer.point || 0}`);
      
      if (customer.extInfo) {
        console.log(`  Subsidy Balance: ¥${customer.extInfo.subsidyAmount || 0}`);
        console.log(`  Total Balance: ¥${(customer.balance || 0) + (customer.extInfo.subsidyAmount || 0)}`);
      }
      
      console.log(`  Status: ${customer.enable === 1 ? 'Active' : 'Inactive'}`);
      console.log(`  Created: ${customer.createdDate || 'N/A'}`);
    } else {
      console.log('⚠️  No customer found with this phone number');
      console.log('This could mean:');
      console.log('  1. The phone number is not registered in the system');
      console.log('  2. The phone number format is incorrect');
      console.log('  3. The customer account is deleted or disabled');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('  1. Invalid API key - check POSPAL_ZD_APPKEY in .env.local');
    console.log('  2. Network issues - check your internet connection');
    console.log('  3. API endpoint changes - contact Pospal support');
  }
}

testConnection();
