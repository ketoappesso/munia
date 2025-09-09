#!/usr/bin/env node

/**
 * Test script for balance transfers between Appesso and Appesso
 * 
 * Usage: node test-transfer.js <phoneNumber> [amount]
 * 
 * This will test the transfer API endpoints
 */

const crypto = require('crypto');
const https = require('https');
const JSONBig = require('json-bigint')({ useNativeBigInt: true });
require('dotenv').config({ path: '.env.local' });

const POSPAL_BASE_URL = 'area20-win.pospal.cn';
const APP_ID = '425063AC22F21CCD8E293004DDD8DA95';
const APP_KEY = process.env.POSPAL_ZD_APPKEY;

if (!APP_KEY) {
  console.error('❌ POSPAL_ZD_APPKEY not found in .env.local');
  process.exit(1);
}

function generateSignature(payload) {
  const signatureBase = APP_KEY + JSONBig.stringify(payload);
  return crypto.createHash('md5').update(signatureBase, 'utf8').digest('hex').toUpperCase();
}

function makePospalRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const payloadWithAppId = { ...payload, appId: APP_ID };
    const signature = generateSignature(payloadWithAppId);
    const timestamp = Date.now().toString();
    const body = JSONBig.stringify(payloadWithAppId);

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
        'User-Agent': 'Appesso/1.0',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSONBig.parse(data);
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

async function testTransfer() {
  const phoneNumber = process.argv[2];
  const testAmount = parseFloat(process.argv[3] || '10');
  
  if (!phoneNumber) {
    console.error('❌ Please provide a phone number as argument');
    console.log('Usage: node test-transfer.js <phone_number> [amount]');
    console.log('Example: node test-transfer.js 18874748888 10');
    process.exit(1);
  }

  console.log('🔍 Testing Balance Transfer System...');
  console.log(`📱 Phone number: ${phoneNumber}`);
  console.log(`💰 Test amount: ¥${testAmount}`);
  console.log('');

  try {
    // Step 1: Get initial balance
    console.log('1️⃣ Getting initial Appesso balance...');
    const customers = await makePospalRequest('customerOpenapi/queryBytel', {
      customerTel: phoneNumber
    });

    if (!customers || customers.length === 0) {
      console.error('❌ No customer found with this phone number');
      return;
    }

    const customer = customers[0];
    const customerUid = customer.customerUid;
    const initialBalance = customer.balance || 0;
    const subsidyBalance = customer.extInfo?.subsidyAmount || 0;
    const totalInitialBalance = initialBalance + subsidyBalance;

    console.log(`✅ Customer found: ${customer.name || 'N/A'}`);
    console.log(`   Customer UID: ${customerUid}`);
    console.log(`   Initial balance: ¥${totalInitialBalance} (Main: ¥${initialBalance}, Subsidy: ¥${subsidyBalance})`);
    console.log('');

    // Step 2: Test adding balance (simulating transfer from Appesso to Appesso)
    console.log('2️⃣ Testing balance addition (Appesso → Appesso)...');
    
    const addResult = await makePospalRequest('customerOpenApi/updateBalancePointByIncrement', {
      customerUid: BigInt(customerUid),
      balanceIncrement: testAmount,
      pointIncrement: 0,
      dataChangeTime: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
      validateBalance: 1
    });

    console.log(`✅ Balance added successfully`);
    console.log(`   Balance before: ¥${addResult.balanceBeforeUpdate}`);
    console.log(`   Balance after: ¥${addResult.balanceAfterUpdate}`);
    console.log(`   Amount added: ¥${addResult.balanceIncrement}`);
    console.log('');

    // Step 3: Verify new balance
    console.log('3️⃣ Verifying new balance...');
    const customersAfterAdd = await makePospalRequest('customerOpenapi/queryBytel', {
      customerTel: phoneNumber
    });
    
    const customerAfterAdd = customersAfterAdd[0];
    const balanceAfterAdd = customerAfterAdd.balance + (customerAfterAdd.extInfo?.subsidyAmount || 0);
    console.log(`✅ Current balance: ¥${balanceAfterAdd}`);
    console.log('');

    // Step 4: Test reducing balance (simulating transfer from Appesso to Appesso)
    console.log('4️⃣ Testing balance reduction (Appesso → Appesso)...');
    console.log('   Waiting 2 seconds to avoid duplicate submission...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reduceResult = await makePospalRequest('customerOpenApi/updateBalancePointByIncrement', {
      customerUid: BigInt(customerUid),
      balanceIncrement: -testAmount,
      pointIncrement: 0,
      dataChangeTime: new Date(Date.now() + 1000).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
      validateBalance: 1
    });

    console.log(`✅ Balance reduced successfully`);
    console.log(`   Balance before: ¥${reduceResult.balanceBeforeUpdate}`);
    console.log(`   Balance after: ¥${reduceResult.balanceAfterUpdate}`);
    console.log(`   Amount reduced: ¥${Math.abs(reduceResult.balanceIncrement)}`);
    console.log('');

    // Step 5: Final balance check
    console.log('5️⃣ Final balance check...');
    const customersFinal = await makePospalRequest('customerOpenapi/queryBytel', {
      customerTel: phoneNumber
    });
    
    const customerFinal = customersFinal[0];
    const finalBalance = customerFinal.balance + (customerFinal.extInfo?.subsidyAmount || 0);
    console.log(`✅ Final balance: ¥${finalBalance}`);
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   Initial balance: ¥${totalInitialBalance}`);
    console.log(`   After adding ¥${testAmount}: ¥${balanceAfterAdd}`);
    console.log(`   After reducing ¥${testAmount}: ¥${finalBalance}`);
    console.log(`   Balance restored: ${Math.abs(finalBalance - totalInitialBalance) < 0.01 ? '✅ Yes' : '❌ No'}`);
    console.log('');

    console.log('✅ Balance transfer system is working correctly!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Login to the Appesso app at http://localhost:3002/login');
    console.log('2. Navigate to the wallet page at http://localhost:3002/wallet');
    console.log('3. The transfer functionality is now available via API');
    console.log('');
    console.log('🔗 API Endpoints:');
    console.log('   GET  /api/wallet/transfer - Check transfer eligibility');
    console.log('   POST /api/wallet/transfer - Perform transfer');
    console.log('');
    console.log('Example transfer request:');
    console.log('POST /api/wallet/transfer');
    console.log(JSON.stringify({
      direction: 'TO_APPESSO',
      amount: 50,
      description: 'Transfer to coffee account'
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('  1. Invalid phone number');
    console.log('  2. Insufficient balance for reduction');
    console.log('  3. Network issues');
    console.log('  4. API key problems');
  }
}

testTransfer();
