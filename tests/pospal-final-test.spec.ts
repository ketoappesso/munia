import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal Final API Test', () => {
  test('test with confirmed AppKey', async ({ request }) => {
    // Confirmed credentials
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977'; // Confirmed correct AppKey
    
    console.log('\n=== Testing with Confirmed Credentials ===');
    console.log('API URL:', apiUrl);
    console.log('App ID:', appId);
    console.log('App KEY:', appKey);
    
    // Generate current timestamp
    const timestamp = Date.now();
    
    // Test different signature formats since the error persists
    const signatureTests = [
      {
        name: 'Standard: MD5(appKey + timestamp + appId) UPPERCASE',
        generate: () => {
          const content = appKey + timestamp + appId;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      },
      {
        name: 'Lowercase: MD5(appKey + timestamp + appId) lowercase',
        generate: () => {
          const content = appKey + timestamp + appId;
          return crypto.createHash('md5').update(content).digest('hex').toLowerCase();
        }
      },
      {
        name: 'Reversed: MD5(appId + timestamp + appKey) UPPERCASE',
        generate: () => {
          const content = appId + timestamp + appKey;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      },
      {
        name: 'No AppId: MD5(appKey + timestamp) UPPERCASE',
        generate: () => {
          const content = appKey + timestamp;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      },
      {
        name: 'AppSecret pattern: MD5(appSecret + timestamp + appId) UPPERCASE',
        generate: () => {
          // Maybe appKey is actually appSecret
          const content = appKey + timestamp + appId;
          return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
        }
      }
    ];
    
    for (const sigTest of signatureTests) {
      console.log(`\n--- Testing: ${sigTest.name} ---`);
      
      const signature = sigTest.generate();
      console.log('Timestamp:', timestamp);
      console.log('Signature:', signature);
      
      const requestBody = {
        "appId": appId,
        "customerTel": "18874748888"
      };
      
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
          console.log('✅ SUCCESS! Found working signature format!');
          console.log('Response:', JSON.stringify(result, null, 2));
          
          if (result.data && result.data.length > 0) {
            const member = result.data[0];
            console.log('\n📋 Member Details:');
            console.log('  Customer UID:', member.customerUid);
            console.log('  Name:', member.name);
            console.log('  Phone:', member.phone);
            console.log('  Number:', member.number);
            console.log('  Level:', member.categoryName);
            console.log('  Balance:', member.balance);
            console.log('  Points:', member.point);
            console.log('  Discount:', member.discount);
            console.log('  Expiry:', member.expiryDate);
            
            // Check if it's Ape Lord member
            if (member.categoryName?.includes('猿佬')) {
              console.log('  🎯 APE LORD MEMBER CONFIRMED!');
            }
          }
          
          return; // Stop testing once we find working format
        } else {
          console.log('❌ Failed:', result.messages?.[0], '(Error code:', result.errorCode, ')');
        }
      } catch (error: any) {
        console.log('❌ Network error:', error.message);
      }
    }
    
    console.log('\n=== All signature formats failed ===');
    console.log('\nPossible issues:');
    console.log('1. The AppKey might need to be used differently');
    console.log('2. The API might require additional authentication');
    console.log('3. The account might not have permission for this API');
  });

  test('direct CURL command generation', async () => {
    const timestamp = Date.now();
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    // Generate signature
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    console.log('\n=== CURL Command for Manual Testing ===\n');
    
    const curlCommand = `curl -X POST 'https://area20-win.pospal.cn:443/pospal-api2/openapi/v1/customerOpenapi/queryBytel' \\
  -H 'User-Agent: openApi' \\
  -H 'Content-Type: application/json; charset=utf-8' \\
  -H 'accept-encoding: gzip,deflate' \\
  -H 'time-stamp: ${timestamp}' \\
  -H 'data-signature: ${signature}' \\
  -d '{
    "appId": "${appId}",
    "customerTel": "18874748888"
  }' \\
  --compressed -v`;
    
    console.log(curlCommand);
    
    console.log('\n--- Debug Information ---');
    console.log('Timestamp:', timestamp);
    console.log('AppKey:', appKey);
    console.log('AppId:', appId);
    console.log('Sign Content:', signContent);
    console.log('Generated Signature:', signature);
    
    // Also generate for example timestamp
    const exampleTimestamp = '1437528688233';
    const exampleContent = appKey + exampleTimestamp + appId;
    const exampleSig = crypto.createHash('md5').update(exampleContent).digest('hex').toUpperCase();
    
    console.log('\n--- With Example Timestamp ---');
    console.log('Example Timestamp:', exampleTimestamp);
    console.log('Our Signature:', exampleSig);
    console.log('Doc Signature:', 'BF706E6AC693BA3B1BABD32E6713431D');
    console.log('Match:', exampleSig === 'BF706E6AC693BA3B1BABD32E6713431D' ? '✅' : '❌');
  });

  test('test alternative endpoints', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    console.log('\n=== Testing Alternative Endpoints ===');
    
    // Test categories endpoint (simpler, no phone required)
    const timestamp = Date.now();
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    console.log('\n--- Testing Categories Endpoint ---');
    console.log('Endpoint: /pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory');
    
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
          "appId": appId
        }
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('✅ Categories endpoint works!');
        console.log('Categories found:', result.data?.length || 0);
        
        if (result.data && Array.isArray(result.data)) {
          console.log('\n📋 Member Categories:');
          result.data.forEach((cat: any) => {
            console.log(`  - ${cat.name}: ${cat.discount}% discount`);
            if (cat.name?.includes('猿佬')) {
              console.log('    🎯 APE LORD CATEGORY FOUND!');
            }
          });
        }
      } else {
        console.log('❌ Categories failed:', result.messages?.[0]);
      }
    } catch (error: any) {
      console.log('❌ Error:', error.message);
    }
  });
});

// Run with: npx playwright test tests/pospal-final-test.spec.ts --project=chromium --reporter=list