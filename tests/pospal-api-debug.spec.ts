import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal API Debug', () => {
  test('test signature variations', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    const phoneNumber = '18874748888';
    
    console.log('\n=== Testing Different Signature Combinations ===\n');
    
    // Try different timestamp formats
    const timestamps = [
      Date.now(), // milliseconds
      Math.floor(Date.now() / 1000), // seconds
      Date.now().toString(), // string milliseconds
    ];
    
    // Try different signature combinations
    const signatureFunctions = [
      // Format 1: appKey + timestamp + appId (uppercase)
      (ts: any) => {
        const content = appKey + ts + appId;
        return {
          name: 'appKey + timestamp + appId (UPPER)',
          content,
          signature: crypto.createHash('md5').update(content).digest('hex').toUpperCase()
        };
      },
      // Format 2: appKey + timestamp + appId (lowercase)  
      (ts: any) => {
        const content = appKey + ts + appId;
        return {
          name: 'appKey + timestamp + appId (lower)',
          content,
          signature: crypto.createHash('md5').update(content).digest('hex').toLowerCase()
        };
      },
      // Format 3: appId + timestamp + appKey
      (ts: any) => {
        const content = appId + ts + appKey;
        return {
          name: 'appId + timestamp + appKey (UPPER)',
          content,
          signature: crypto.createHash('md5').update(content).digest('hex').toUpperCase()
        };
      },
      // Format 4: Try with UTF-8 encoding explicitly
      (ts: any) => {
        const content = appKey + ts + appId;
        return {
          name: 'appKey + timestamp + appId (UTF-8 UPPER)',
          content,
          signature: crypto.createHash('md5').update(content, 'utf8').digest('hex').toUpperCase()
        };
      },
      // Format 5: Try without concatenation (separate updates)
      (ts: any) => {
        const hash = crypto.createHash('md5');
        hash.update(appKey);
        hash.update(ts.toString());
        hash.update(appId);
        return {
          name: 'Separate updates (UPPER)',
          content: appKey + ts + appId,
          signature: hash.digest('hex').toUpperCase()
        };
      }
    ];
    
    for (const timestamp of timestamps) {
      console.log(`\nTesting with timestamp format: ${typeof timestamp} - ${timestamp}`);
      
      for (const signFunc of signatureFunctions) {
        const signData = signFunc(timestamp);
        console.log(`\n  ${signData.name}:`);
        console.log(`    Content: ${signData.content.substring(0, 50)}...`);
        console.log(`    Signature: ${signData.signature}`);
        
        try {
          const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
            headers: {
              'User-Agent': 'openApi',
              'Content-Type': 'application/json; charset=utf-8',
              'accept-encoding': 'gzip,deflate',
              'time-stamp': timestamp.toString(),
              'data-signature': signData.signature
            },
            data: {
              appId: appId,
              customerTel: phoneNumber
            }
          });
          
          const result = await response.json();
          
          if (result.status === 'success') {
            console.log(`    ✅ SUCCESS! This signature format works!`);
            console.log(`    Response:`, JSON.stringify(result.data?.[0], null, 2));
            return; // Stop testing once we find a working format
          } else {
            console.log(`    ❌ Failed: ${result.messages?.[0] || 'Unknown error'}`);
          }
        } catch (error) {
          console.log(`    ❌ Error: ${error}`);
        }
      }
    }
    
    console.log('\n=== All signature formats failed ===');
    console.log('The API credentials might be incorrect or expired.');
  });

  test('test with number as member ID instead of phone', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    const timestamp = Date.now();
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    console.log('\n=== Testing with member number instead of phone ===\n');
    
    // Try querying by member number instead
    try {
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryByNumber`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': timestamp.toString(),
          'data-signature': signature
        },
        data: {
          appId: appId,
          customerNum: '18874748888' // Try as member number
        }
      });
      
      const result = await response.json();
      console.log('Query by number response:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('Error:', error);
    }
  });
});

// Run with: npx playwright test tests/pospal-api-debug.spec.ts --project=chromium --reporter=list