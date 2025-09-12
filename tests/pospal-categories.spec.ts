import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal Categories API', () => {
  test('query all customer categories', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    // Try with exact example from documentation
    console.log('\n=== Testing with Documentation Example ===');
    console.log('Expected signature from docs: BF706E6AC693BA3B1BABD32E6713431D');
    
    // Test with example timestamp from docs
    const exampleTimestamp = '1437528688233';
    const exampleAppId = 'abcdefghijklmn'; // Example appId from docs
    
    // Calculate what the appKey should be to get the example signature
    // This helps us understand the signature format
    
    // Let's try to reproduce the example
    const testCombinations = [
      { desc: 'Example values', appKey: 'unknown', timestamp: exampleTimestamp, appId: exampleAppId },
      { desc: 'Our credentials', appKey: appKey, timestamp: Date.now().toString(), appId: appId },
    ];
    
    for (const combo of testCombinations) {
      console.log(`\n${combo.desc}:`);
      console.log(`  AppID: ${combo.appId}`);
      console.log(`  Timestamp: ${combo.timestamp}`);
      
      if (combo.appKey !== 'unknown') {
        const signContent = combo.appKey + combo.timestamp + combo.appId;
        const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
        
        console.log(`  Sign Content: ${signContent}`);
        console.log(`  Generated Signature: ${signature}`);
        
        try {
          const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory`, {
            headers: {
              'User-Agent': 'openApi',
              'Content-Type': 'application/json; charset=utf-8',
              'accept-encoding': 'gzip,deflate',
              'time-stamp': combo.timestamp,
              'data-signature': signature
            },
            data: {
              appId: combo.appId
            }
          });
          
          const result = await response.json();
          console.log('  Response:', JSON.stringify(result, null, 2));
          
          if (result.status === 'success') {
            console.log('\n✅ SUCCESS! Found member categories:');
            result.data?.forEach((category: any) => {
              console.log(`  - ${category.name}: ${category.discount}% discount`);
              if (category.name?.includes('猿佬')) {
                console.log('    ** APE LORD CATEGORY FOUND **');
              }
            });
          }
        } catch (error) {
          console.log('  Error:', error);
        }
      }
    }
    
    // Now let's try a simpler approach - maybe the credentials are wrong
    console.log('\n=== Testing Direct API Call ===');
    
    const timestamp = Date.now().toString();
    
    // Try different appKey possibilities (maybe there's a typo)
    const possibleKeys = [
      appKey, // Original
      '292141986252122977', // Make sure it's a string
      appKey.trim(), // Remove any whitespace
    ];
    
    for (const testKey of possibleKeys) {
      const signContent = testKey + timestamp + appId;
      const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
      
      console.log(`\nTrying with key: ${testKey}`);
      console.log(`  Timestamp: ${timestamp}`);
      console.log(`  Signature: ${signature}`);
      
      try {
        const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory`, {
          headers: {
            'User-Agent': 'openApi',
            'Content-Type': 'application/json; charset=utf-8',
            'accept-encoding': 'gzip,deflate',
            'time-stamp': timestamp,
            'data-signature': signature
          },
          data: {
            appId: appId
          },
          timeout: 10000
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          console.log('  ✅ SUCCESS!');
          console.log('  Categories:', result.data);
          break;
        } else {
          console.log('  ❌ Failed:', result.messages?.[0]);
        }
      } catch (error: any) {
        console.log('  ❌ Error:', error.message);
      }
    }
  });
});

// Run with: npx playwright test tests/pospal-categories.spec.ts --project=chromium --reporter=list