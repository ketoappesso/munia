#!/usr/bin/env node

/**
 * Test script to simulate UI transfer request
 * This mimics what the wallet page does when you click transfer
 */

const http = require('http');

async function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testTransfer() {
  const direction = process.argv[2] || 'TO_APPESSO';
  const amount = parseFloat(process.argv[3] || '1');
  
  console.log('🔍 Testing UI Transfer Request...');
  console.log(`   Direction: ${direction}`);
  console.log(`   Amount: ${amount}`);
  console.log('');
  
  // Create transfer request body
  const requestBody = JSON.stringify({
    direction: direction,
    amount: amount,
    description: `Test transfer ${direction === 'TO_APPESSO' ? 'to' : 'from'} Appesso`
  });
  
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/wallet/transfer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    }
  };
  
  try {
    console.log('📡 Sending transfer request to /api/wallet/transfer...');
    console.log('   Request body:', requestBody);
    console.log('');
    
    const response = await makeRequest(options, requestBody);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${response.data}`);
    console.log('');
    
    if (response.status === 401) {
      console.log('⚠️  Unauthorized - Need to be logged in');
      console.log('   Please login at http://localhost:3002/login first');
    } else if (response.status === 500) {
      console.log('❌ Internal Server Error');
      console.log('   Check server logs for details');
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(response.data);
        console.log('   Error message:', errorData.error);
      } catch (e) {
        // Ignore parse errors
      }
    } else if (response.status === 200) {
      console.log('✅ Transfer successful!');
      const result = JSON.parse(response.data);
      console.log('   New balances:');
      console.log('   - APE:', result.balances?.apeBalance);
      console.log('   - Appesso:', result.balances?.appessoBalance);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTransfer();
