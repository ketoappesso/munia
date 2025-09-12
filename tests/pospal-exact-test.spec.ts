import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal Exact Format Test', () => {
  test('test with exact format from documentation', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    console.log('\n=== Testing with EXACT Format ===');
    
    // Use the exact timestamp from the example
    const exampleTimestamp = '1437528688233';
    const exampleSignature = 'BF706E6AC693BA3B1BABD32E6713431D';
    
    console.log('Example from documentation:');
    console.log('  Timestamp:', exampleTimestamp);
    console.log('  Signature:', exampleSignature);
    
    // Now test with current timestamp
    const currentTimestamp = Date.now().toString();
    const signContent = appKey + currentTimestamp + appId;
    const currentSignature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    console.log('\nCurrent request:');
    console.log('  Timestamp:', currentTimestamp);
    console.log('  Sign Content:', signContent);
    console.log('  Generated Signature:', currentSignature);
    
    // Exact request body as shown in documentation
    const requestBody = {
      "appId": "425063AC22F21CCD8E293004DDD8DA95",
      "customerTel": "18874748888"
    };
    
    console.log('  Request Body:', JSON.stringify(requestBody, null, 2));
    
    try {
      // Test with current timestamp
      console.log('\n--- Attempt 1: Current timestamp ---');
      let response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': currentTimestamp,
          'data-signature': currentSignature
        },
        data: requestBody
      });
      
      let result = await response.json();
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.status === 'success') {
        console.log('✅ SUCCESS!');
        if (result.data && result.data.length > 0) {
          const member = result.data[0];
          console.log('\n📋 Member Found:');
          console.log('  Name:', member.name);
          console.log('  Phone:', member.phone);
          console.log('  Level:', member.categoryName);
          console.log('  Balance:', member.balance);
          console.log('  Points:', member.point);
        }
      } else {
        console.log('❌ Failed with current timestamp');
      }
      
      // Try with lowercase signature
      console.log('\n--- Attempt 2: Lowercase signature ---');
      const lowercaseSignature = crypto.createHash('md5').update(signContent).digest('hex').toLowerCase();
      console.log('  Lowercase Signature:', lowercaseSignature);
      
      response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': currentTimestamp,
          'data-signature': lowercaseSignature
        },
        data: requestBody
      });
      
      result = await response.json();
      if (result.status === 'success') {
        console.log('✅ SUCCESS with lowercase!');
      } else {
        console.log('❌ Failed with lowercase');
      }
      
      // Try without UTF-8 in Content-Type
      console.log('\n--- Attempt 3: Without charset in Content-Type ---');
      response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': currentTimestamp,
          'data-signature': currentSignature
        },
        data: requestBody
      });
      
      result = await response.json();
      if (result.status === 'success') {
        console.log('✅ SUCCESS without charset!');
      } else {
        console.log('❌ Failed without charset');
      }
      
    } catch (error: any) {
      console.log('Network Error:', error.message);
    }
  });
  
  test('verify signature algorithm', async () => {
    console.log('\n=== Signature Algorithm Verification ===');
    
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    // Test with the example timestamp
    const exampleTimestamp = '1437528688233';
    const expectedSignature = 'BF706E6AC693BA3B1BABD32E6713431D';
    
    // Try to reverse engineer the correct appKey
    console.log('If the signature from docs is correct:');
    console.log('  Expected:', expectedSignature);
    
    // Test our signature generation
    const ourSignContent = appKey + exampleTimestamp + appId;
    const ourSignature = crypto.createHash('md5').update(ourSignContent).digest('hex').toUpperCase();
    
    console.log('\nWith our appKey:');
    console.log('  Content:', ourSignContent);
    console.log('  Generated:', ourSignature);
    console.log('  Match:', ourSignature === expectedSignature ? '✅' : '❌');
    
    // This confirms the appKey is different from the example
    if (ourSignature !== expectedSignature) {
      console.log('\nThis confirms that either:');
      console.log('1. The appKey in the documentation example is different');
      console.log('2. The signature algorithm is different');
      console.log('3. The appKey we have might be incorrect');
    }
  });
  
  test('test with all possible header combinations', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    const timestamp = Date.now().toString();
    
    console.log('\n=== Testing Header Combinations ===');
    
    // Different signature formats to try
    const signatures = [
      {
        name: 'MD5 Uppercase',
        value: crypto.createHash('md5').update(appKey + timestamp + appId).digest('hex').toUpperCase()
      },
      {
        name: 'MD5 Lowercase', 
        value: crypto.createHash('md5').update(appKey + timestamp + appId).digest('hex').toLowerCase()
      }
    ];
    
    // Different header combinations
    const headerSets = [
      {
        name: 'Standard headers',
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate'
        }
      },
      {
        name: 'No charset',
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json',
          'accept-encoding': 'gzip,deflate'
        }
      },
      {
        name: 'Additional headers',
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'accept-encoding': 'gzip,deflate'
        }
      }
    ];
    
    for (const sig of signatures) {
      for (const headerSet of headerSets) {
        console.log(`\nTrying: ${sig.name} with ${headerSet.name}`);
        
        try {
          const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
            headers: {
              ...headerSet.headers,
              'time-stamp': timestamp,
              'data-signature': sig.value
            },
            data: {
              "appId": appId,
              "customerTel": "18874748888"
            }
          });
          
          const result = await response.json();
          
          if (result.status === 'success') {
            console.log(`✅ SUCCESS! Working combination found:`);
            console.log(`  Signature: ${sig.name}`);
            console.log(`  Headers: ${headerSet.name}`);
            console.log(`  Response:`, JSON.stringify(result, null, 2));
            return; // Stop testing once we find a working combination
          } else {
            console.log(`  ❌ Failed: ${result.messages?.[0]}`);
          }
        } catch (error: any) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n❌ All combinations failed');
  });
});

// Run with: npx playwright test tests/pospal-exact-test.spec.ts --project=chromium --reporter=list