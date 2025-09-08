import dotenv from 'dotenv';
import crypto from 'crypto';
import JSONBigLib from 'json-bigint';

// Load environment variables
dotenv.config();

const JSONBig = JSONBigLib;

// Pospal API configuration (copied from client.ts)
const POSPAL_BASE_URL = 'https://area20-win.pospal.cn/pospal-api2/openapi/v1';
const MAIN_STORE_CONFIG = {
  appId: '425063AC22F21CCD8E293004DDD8DA95',
  name: '总店'
};

// Simple API client
async function queryCustomerByPhone(phoneNumber) {
  const appKey = process.env.POSPAL_ZD_APPKEY || '';
  
  if (!appKey) {
    console.log('API key not configured');
    return null;
  }
  
  const JSONBigInstance = JSONBig({ useNativeBigInt: true });
  
  const payload = {
    appId: MAIN_STORE_CONFIG.appId,
    customerTel: phoneNumber,
  };
  
  // Generate signature
  const signatureBase = appKey + JSONBigInstance.stringify(payload);
  const signature = crypto.createHash('md5').update(signatureBase, 'utf8').digest('hex').toUpperCase();
  const timestamp = Date.now().toString();
  
  try {
    const response = await fetch(`${POSPAL_BASE_URL}/customerOpenapi/queryBytel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'time-stamp': timestamp,
        'data-signature': signature,
        'User-Agent': 'Munia/1.0',
      },
      body: JSONBigInstance.stringify(payload),
    });
    
    if (!response.ok) {
      console.log('API request failed:', response.statusText);
      return null;
    }
    
    const responseText = await response.text();
    const result = JSONBigInstance.parse(responseText);
    
    if (result.status !== 'success') {
      console.log('API error:', result.messages?.join(', '));
      return null;
    }
    
    return result.data && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    console.error('Request error:', error);
    return null;
  }
}

async function testAppessoAccount() {
  const phoneNumber = '18874748888';
  
  console.log(`Testing Appesso account for phone: ${phoneNumber}`);
  console.log('-----------------------------------');
  
  try {
    // Check if API key is configured
    const hasApiKey = !!process.env.POSPAL_ZD_APPKEY;
    console.log(`API Key configured: ${hasApiKey}`);
    
    if (!hasApiKey) {
      console.log('⚠️  POSPAL_ZD_APPKEY not found in .env file');
      console.log('Please add POSPAL_ZD_APPKEY to your .env file');
      return;
    }
    
    // Try to query customer by phone
    console.log(`\nQuerying customer by phone: ${phoneNumber}...`);
    const customer = await queryCustomerByPhone(phoneNumber);
    
    if (customer) {
      console.log('✅ Appesso account found!');
      console.log('\nCustomer Details:');
      console.log('  Name:', customer.name);
      console.log('  Member Number:', customer.number);
      console.log('  Phone:', customer.phone);
      console.log('  Balance:', customer.balance);
      console.log('  Points:', customer.point);
      
      if (customer.extInfo) {
        console.log('  Subsidy Amount:', customer.extInfo?.subsidyAmount || 0);
        console.log('  Total Balance:', customer.balance + (customer.extInfo?.subsidyAmount || 0));
      }
    } else {
      console.log('❌ No Appesso account found for this phone number');
      console.log('\nPossible reasons:');
      console.log('1. The phone number is not registered in Appesso system');
      console.log('2. The API key might not have proper permissions');
      console.log('3. There might be a connection issue with the Pospal API');
    }
    
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('\nFull error:', error);
  }
}

testAppessoAccount();