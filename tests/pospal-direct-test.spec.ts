import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal Direct API Test', () => {
  test('test with exact request body', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    console.log('\n=== Testing Pospal API with Exact Request ===');
    console.log('URL:', `${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`);
    console.log('AppID:', appId);
    console.log('AppKey:', appKey);
    console.log('Phone:', '18874748888');
    
    // Test different timestamp and signature combinations
    const tests = [
      {
        name: 'Milliseconds timestamp, uppercase MD5',
        timestamp: Date.now(),
        getSignature: (ts: number) => {
          const content = appKey + ts + appId;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      },
      {
        name: 'Milliseconds timestamp, lowercase MD5',
        timestamp: Date.now(),
        getSignature: (ts: number) => {
          const content = appKey + ts + appId;
          return crypto.createHash('md5').update(content).digest('hex').toLowerCase();
        }
      },
      {
        name: 'Seconds timestamp, uppercase MD5',
        timestamp: Math.floor(Date.now() / 1000),
        getSignature: (ts: number) => {
          const content = appKey + ts + appId;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      },
      {
        name: 'String timestamp, uppercase MD5',
        timestamp: Date.now().toString(),
        getSignature: (ts: any) => {
          const content = appKey + ts + appId;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      }
    ];
    
    for (const testCase of tests) {
      console.log(`\n--- ${testCase.name} ---`);
      const timestamp = testCase.timestamp;
      const signature = testCase.getSignature(timestamp);
      
      console.log('Timestamp:', timestamp, `(${typeof timestamp})`);
      console.log('Signature:', signature);
      
      const requestBody = {
        appId: appId,
        customerTel: "18874748888"
      };
      
      console.log('Request Body:', JSON.stringify(requestBody));
      
      try {
        const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
          headers: {
            'User-Agent': 'openApi',
            'Content-Type': 'application/json; charset=utf-8',
            'accept-encoding': 'gzip,deflate',
            'time-stamp': timestamp.toString(),
            'data-signature': signature
          },
          data: requestBody
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          console.log('✅ SUCCESS! Response:', JSON.stringify(result, null, 2));
          
          if (result.data && result.data.length > 0) {
            const member = result.data[0];
            console.log('\n📋 Member Details:');
            console.log('  Name:', member.name);
            console.log('  Phone:', member.phone);
            console.log('  Member Number:', member.number);
            console.log('  Level:', member.categoryName);
            console.log('  Balance:', member.balance);
            console.log('  Points:', member.point);
            console.log('  Discount:', member.discount, '%');
            console.log('  Expiry Date:', member.expiryDate || 'No expiry');
            console.log('  Status:', member.enable === 1 ? 'Active' : 'Inactive');
            
            // Check if it's Ape Lord member
            if (member.categoryName?.includes('猿佬')) {
              console.log('  🎯 This is an APE LORD member!');
            }
          } else {
            console.log('  No member found with this phone number');
          }
          
          // Stop testing once we find a working format
          break;
        } else {
          console.log('❌ Failed:', result.messages?.join(', '));
          if (result.errorCode) {
            console.log('Error Code:', result.errorCode);
          }
        }
      } catch (error: any) {
        console.log('❌ Network Error:', error.message);
      }
    }
    
    // Also test the categories endpoint
    console.log('\n\n=== Testing Categories Endpoint ===');
    
    const timestamp = Date.now();
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    try {
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': timestamp.toString(),
          'data-signature': signature
        },
        data: {
          appId: appId
        }
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('✅ Categories retrieved successfully!');
        if (result.data && Array.isArray(result.data)) {
          console.log('\n📋 Available Member Levels:');
          result.data.forEach((category: any) => {
            console.log(`  - ${category.name} (${category.discount}% discount)`);
            if (category.name?.includes('猿佬')) {
              console.log('    🎯 APE LORD CATEGORY FOUND!');
            }
          });
        }
      } else {
        console.log('❌ Categories query failed:', result.messages?.join(', '));
      }
    } catch (error: any) {
      console.log('❌ Network Error:', error.message);
    }
  });
  
  test('test manual curl equivalent', async () => {
    console.log('\n=== Manual CURL Command ===');
    console.log('You can test the API manually with this curl command:\n');
    
    const timestamp = Date.now();
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    const curlCommand = `curl -X POST https://area20-win.pospal.cn:443/pospal-api2/openapi/v1/customerOpenapi/queryBytel \\
  -H "User-Agent: openApi" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -H "accept-encoding: gzip,deflate" \\
  -H "time-stamp: ${timestamp}" \\
  -H "data-signature: ${signature}" \\
  -d '{
    "appId": "${appId}",
    "customerTel": "18874748888"
  }'`;
    
    console.log(curlCommand);
    console.log('\nTimestamp:', timestamp);
    console.log('Signature:', signature);
  });
});

// Run with: npx playwright test tests/pospal-direct-test.spec.ts --project=chromium --reporter=list