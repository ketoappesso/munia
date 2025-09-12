import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal Simple Test', () => {
  test('test member categories with confirmed credentials', async ({ request }) => {
    // Confirmed credentials
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    console.log('\n=== Testing Pospal API - Member Categories ===');
    console.log('API URL:', apiUrl);
    console.log('App ID:', appId);
    console.log('App Key:', appKey);
    
    const timestamp = Date.now();
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    console.log('Timestamp:', timestamp);
    console.log('Sign Content:', signContent);
    console.log('Generated Signature:', signature);
    
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
      
      console.log('Response Status:', response.status());
      const result = await response.json();
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.status === 'success') {
        console.log('\n✅ SUCCESS! Member categories retrieved:');
        if (result.data && Array.isArray(result.data)) {
          result.data.forEach((category: any) => {
            console.log(`  - ${category.name}`);
            console.log(`    UID: ${category.uid}`);
            console.log(`    Discount: ${category.discount}%`);
            console.log(`    Enabled: ${category.enable === 1 ? 'Yes' : 'No'}`);
            console.log(`    Can Earn Points: ${category.isPoint === 1 ? 'Yes' : 'No'}`);
            
            if (category.name?.includes('猿佬')) {
              console.log(`    ** APE LORD CATEGORY **`);
            }
          });
        }
      } else {
        console.log('\n❌ API Error:', result.messages?.join(', '));
        console.log('Error Code:', result.errorCode);
        
        if (result.errorCode === 1032) {
          console.log('\nSignature mismatch - possible causes:');
          console.log('1. The appKey might be incorrect');
          console.log('2. The signature algorithm might need adjustment');
          console.log('3. The API might require additional headers');
        }
      }
    } catch (error) {
      console.log('Network Error:', error);
    }
  });

  test('test phone number query with confirmed credentials', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    const phoneNumber = '18874748888';
    
    console.log('\n=== Testing Pospal API - Query by Phone ===');
    console.log('Phone Number:', phoneNumber);
    
    const timestamp = Date.now();
    const signContent = appKey + timestamp + appId;
    const signature = crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
    
    try {
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': timestamp.toString(),
          'data-signature': signature
        },
        data: {
          appId: appId,
          customerTel: phoneNumber
        }
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('\n✅ SUCCESS! Member found:');
        if (result.data && result.data.length > 0) {
          const member = result.data[0];
          console.log('  Name:', member.name);
          console.log('  Level:', member.categoryName);
          console.log('  Balance:', member.balance);
          console.log('  Points:', member.point);
          console.log('  Expiry:', member.expiryDate);
        }
      } else {
        console.log('❌ Failed:', result.messages?.join(', '));
      }
    } catch (error) {
      console.log('Error:', error);
    }
  });
});

// Run with: npx playwright test tests/pospal-simple-test.spec.ts --project=chromium --reporter=list