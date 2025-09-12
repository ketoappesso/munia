import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Pospal Live API Test', () => {
  test('test with live Pospal credentials', async ({ request }) => {
    // Live credentials from user
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    console.log('\n=== Testing with Live Pospal Credentials ===');
    console.log('Company: 猿素Appesso');
    console.log('Industry: 茶饮行业');
    console.log('User Area: 20区');
    console.log('Account: 15873179744');
    console.log('API URL:', apiUrl);
    console.log('App ID:', appId);
    
    // Test phone numbers
    const testPhones = ['18874748888', '15873179744'];
    
    for (const phone of testPhones) {
      console.log(`\n--- Testing phone: ${phone} ---`);
      
      const payload = {
        appId: appId,
        customerTel: phone
      };
      
      // Use the working signature method from our successful balance queries
      const signatureBase = appKey + JSON.stringify(payload);
      const signature = crypto.createHash('md5')
        .update(signatureBase, 'utf8')
        .digest('hex')
        .toUpperCase();
      
      console.log('Payload:', JSON.stringify(payload));
      console.log('Signature Base:', signatureBase);
      console.log('Generated Signature:', signature);
      
      try {
        const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`, {
          headers: {
            'User-Agent': 'openApi',
            'Content-Type': 'application/json; charset=utf-8',
            'accept-encoding': 'gzip,deflate',
            'time-stamp': Date.now().toString(),
            'data-signature': signature
          },
          data: payload
        });
        
        const responseData = await response.json();
        console.log('Response Status:', response.status());
        console.log('Response:', JSON.stringify(responseData, null, 2));
        
        if (responseData.status === 'success') {
          console.log('✅ SUCCESS! API call succeeded');
          
          if (responseData.data && responseData.data.length > 0) {
            const member = responseData.data[0];
            console.log('\n📋 Member Details:');
            console.log('  Customer UID:', member.customerUid);
            console.log('  Name:', member.name);
            console.log('  Phone:', member.phone);
            console.log('  Number:', member.number);
            console.log('  Category/Level:', member.categoryName);
            console.log('  Balance:', member.balance);
            console.log('  Points:', member.point);
            console.log('  Discount:', member.discount);
            console.log('  Enable:', member.enable);
            console.log('  Expiry Date:', member.expiryDate);
            
            // Check if it's an Ape Lord member
            if (member.categoryName) {
              if (member.categoryName.includes('猿佬')) {
                console.log('  🎯 APE LORD MEMBER (猿佬会员) CONFIRMED!');
              } else if (member.categoryName.includes('钻石')) {
                console.log('  💎 DIAMOND MEMBER (钻石会员)');
              } else if (member.categoryName.includes('金')) {
                console.log('  🏆 GOLD MEMBER (金卡会员)');
              } else if (member.categoryName.includes('银')) {
                console.log('  🥈 SILVER MEMBER (银卡会员)');
              }
            }
            
            // Check subsidy amount if available
            if (member.extInfo?.subsidyAmount) {
              console.log('  Subsidy Amount:', member.extInfo.subsidyAmount);
              console.log('  Total Balance:', (member.balance || 0) + member.extInfo.subsidyAmount);
            }
          } else {
            console.log('⚠️ No member found for this phone number');
          }
        } else {
          console.log('❌ API call failed:', responseData.messages?.join(', '));
          if (responseData.errorCode) {
            console.log('Error Code:', responseData.errorCode);
          }
        }
      } catch (error: any) {
        console.log('❌ Network error:', error.message);
      }
    }
  });
  
  test('test member categories endpoint', async ({ request }) => {
    const apiUrl = 'https://area20-win.pospal.cn:443';
    const appId = '425063AC22F21CCD8E293004DDD8DA95';
    const appKey = '292141986252122977';
    
    console.log('\n=== Testing Member Categories Endpoint ===');
    
    const payload = {
      appId: appId
    };
    
    const signature = crypto.createHash('md5')
      .update(appKey + JSON.stringify(payload), 'utf8')
      .digest('hex')
      .toUpperCase();
    
    try {
      const response = await request.post(`${apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory`, {
        headers: {
          'User-Agent': 'openApi',
          'Content-Type': 'application/json; charset=utf-8',
          'accept-encoding': 'gzip,deflate',
          'time-stamp': Date.now().toString(),
          'data-signature': signature
        },
        data: payload
      });
      
      const responseData = await response.json();
      
      if (responseData.status === 'success') {
        console.log('✅ Categories retrieved successfully!');
        
        if (responseData.data && Array.isArray(responseData.data)) {
          console.log('\n📋 Member Categories:');
          responseData.data.forEach((cat: any) => {
            console.log(`  - ${cat.name || cat.categoryName}: ${cat.discount}% discount`);
            if (cat.name?.includes('猿佬') || cat.categoryName?.includes('猿佬')) {
              console.log('    🎯 APE LORD CATEGORY FOUND!');
            }
          });
        }
      } else {
        console.log('❌ Failed to get categories:', responseData.messages?.join(', '));
      }
    } catch (error: any) {
      console.log('❌ Error:', error.message);
    }
  });
});

// Run with: npx playwright test tests/pospal-live-test.spec.ts --project=chromium --reporter=list