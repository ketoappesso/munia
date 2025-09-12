import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal API Simple Test', () => {
  test('test direct API call with minimal params', async ({ request }) => {
    // Original credentials from documentation
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    // Test with simple timestamp
    const timestamp = Date.now().toString();
    
    // Try different signature formats
    console.log('\n=== Testing Different Signature Formats ===\n');
    
    // Format 1: appKey + timestamp + appId (uppercase)
    const signContent1 = appKey + timestamp + appId;
    const signature1 = crypto.createHash('md5').update(signContent1).digest('hex').toUpperCase();
    console.log('Format 1 (appKey + timestamp + appId) uppercase:');
    console.log('  Content:', signContent1);
    console.log('  Signature:', signature1);
    
    // Format 2: appKey + timestamp + appId (lowercase)
    const signature2 = crypto.createHash('md5').update(signContent1).digest('hex').toLowerCase();
    console.log('\nFormat 2 (appKey + timestamp + appId) lowercase:');
    console.log('  Signature:', signature2);
    
    // Format 3: appId + timestamp + appKey
    const signContent3 = appId + timestamp + appKey;
    const signature3 = crypto.createHash('md5').update(signContent3).digest('hex').toUpperCase();
    console.log('\nFormat 3 (appId + timestamp + appKey) uppercase:');
    console.log('  Content:', signContent3);
    console.log('  Signature:', signature3);
    
    // Format 4: timestamp + appKey + appId
    const signContent4 = timestamp + appKey + appId;
    const signature4 = crypto.createHash('md5').update(signContent4).digest('hex').toUpperCase();
    console.log('\nFormat 4 (timestamp + appKey + appId) uppercase:');
    console.log('  Content:', signContent4);
    console.log('  Signature:', signature4);
    
    console.log('\n=== Testing API Calls ===\n');
    
    // Try with Format 1 (most likely based on docs)
    try {
      console.log('Testing with Format 1...');
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': timestamp,
          'data-signature': signature1
        },
        data: {
          appId: appId,
          customerTel: '18874748888'
        }
      });
      
      const result = await response.json();
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.status === 'success') {
        console.log('✅ Format 1 worked!');
      } else {
        console.log('❌ Format 1 failed:', result.messages?.join(', '));
      }
    } catch (error) {
      console.log('❌ Format 1 error:', error);
    }
    
    // Try with Format 2
    try {
      console.log('\nTesting with Format 2...');
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': timestamp,
          'data-signature': signature2
        },
        data: {
          appId: appId,
          customerTel: '18874748888'
        }
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        console.log('✅ Format 2 worked!');
        console.log('Response:', JSON.stringify(result, null, 2));
      } else {
        console.log('❌ Format 2 failed:', result.messages?.join(', '));
      }
    } catch (error) {
      console.log('❌ Format 2 error:', error);
    }
    
    // Try querying member categories (simpler endpoint)
    console.log('\n=== Testing Member Categories Endpoint ===\n');
    try {
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': timestamp,
          'data-signature': signature1
        },
        data: {
          appId: appId
        }
      });
      
      const result = await response.json();
      console.log('Categories Response:', JSON.stringify(result, null, 2));
      
      if (result.status === 'success') {
        console.log('✅ Categories endpoint worked!');
      } else {
        console.log('❌ Categories endpoint failed:', result.messages?.join(', '));
      }
    } catch (error) {
      console.log('❌ Categories endpoint error:', error);
    }
  });
  
  test('test with mock server to verify signature', async ({ request }) => {
    // This test helps understand what the server expects
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    const timestamp = '1437528688233'; // Use the example timestamp from docs
    
    // According to docs: md5(appscrect+timestamp+appid)
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    console.log('\n=== Signature Verification ===');
    console.log('AppID:', appId);
    console.log('AppKey:', appKey);
    console.log('Timestamp:', timestamp);
    console.log('Sign Content:', signContent);
    console.log('Generated Signature:', signature);
    console.log('Example from docs: BF706E6AC693BA3B1BABD32E6713431D');
    
    // Check if our signature matches the example (it won't, but shows the format)
    if (signature === 'BF706E6AC693BA3B1BABD32E6713431D') {
      console.log('✅ Signature matches example!');
    } else {
      console.log('❌ Signature does not match example');
      console.log('This is expected as we\'re using different credentials');
    }
  });
});