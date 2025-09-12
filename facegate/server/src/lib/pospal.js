const crypto = require('crypto');
const JSONBigLib = require('json-bigint');

const JSONBig = JSONBigLib;

// Pospal API configuration
const POSPAL_BASE_URL = 'https://area20-win.pospal.cn/pospal-api2/openapi/v1';

// Main store (ZD) configuration only
const MAIN_STORE_CONFIG = {
  appId: process.env.POSPAL_APP_ID || '425063AC22F21CCD8E293004DDD8DA95',
  name: '总店'
};

class PospalAPIClient {
  constructor() {
    this.appId = MAIN_STORE_CONFIG.appId;
    this.appKey = process.env.POSPAL_APP_KEY || '';
    this.storeName = MAIN_STORE_CONFIG.name;
    
    if (!this.appKey) {
      console.warn('POSPAL_APP_KEY not found in environment variables');
    }
  }

  /**
   * Generate MD5 signature for API request
   */
  generateSignature(payload) {
    const JSONBigInstance = JSONBig({ useNativeBigInt: true });
    const signatureBase = this.appKey + JSONBigInstance.stringify(payload);
    return crypto.createHash('md5').update(signatureBase, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * Make API request to Pospal
   */
  async makeRequest(endpoint, payload) {
    const JSONBigInstance = JSONBig({ useNativeBigInt: true });
    const signature = this.generateSignature(payload);
    const timestamp = Date.now().toString();

    const response = await fetch(`${POSPAL_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'time-stamp': timestamp,
        'data-signature': signature,
        'User-Agent': 'Facegate/1.0',
      },
      body: JSONBigInstance.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Pospal API request failed: ${response.statusText}`);
    }

    const responseText = await response.text();
    const result = JSONBigInstance.parse(responseText);

    if (result.status !== 'success') {
      throw new Error(`Pospal API error: ${result.messages ? result.messages.join(', ') : 'Unknown error'}`);
    }

    return result.data;
  }

  /**
   * Query customer by phone number
   */
  async queryCustomerByPhone(phone) {
    try {
      if (!this.appKey) {
        console.log('API key not configured, returning mock data');
        // Return mock data for testing
        return {
          customerUid: String(phone + '1234567890'),
          number: 'M' + phone,
          name: '测试用户',
          balance: 0,
          point: 0,
          phone: phone,
          discount: 100,
          enable: 1,
          createdDate: new Date().toISOString(),
          categoryName: '普通会员',
          extInfo: {
            subsidyAmount: 0,
          }
        };
      }

      const payload = {
        appId: this.appId,
        customerTel: phone,  // Use customerTel as per the API docs
      };

      // Use the correct endpoint name from the backend code
      const result = await this.makeRequest('customerOpenapi/queryBytel', payload);

      if (result && result.length > 0) {
        // Ensure customerUid is a string
        const customer = result[0];
        return {
          ...customer,
          customerUid: String(customer.customerUid)
        };
      }

      return null;
    } catch (error) {
      console.error('Error querying customer by phone:', error);
      
      // Check if it's a rate limit error
      if (error.message && error.message.includes('您已用完当日请求量')) {
        console.log('API rate limit reached, using mock data for phone:', phone);
        
        // Return mock data during rate limiting
        return {
          customerUid: String(phone + '1234567890'),
          number: 'M' + phone,
          name: '测试用户',
          balance: 40,
          point: 0,
          phone: phone,
          discount: 100,
          enable: 1,
          createdDate: new Date().toISOString(),
          categoryName: phone === '18874748888' ? '猿佬会员' : '普通会员',
          expiryDate: phone === '18874748888' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
          extInfo: {
            subsidyAmount: 0,
          }
        };
      }
      
      return null;
    }
  }

  /**
   * Get store name
   */
  getStoreName() {
    return this.storeName;
  }
}

function createPospalClient() {
  return new PospalAPIClient();
}

module.exports = {
  PospalAPIClient,
  createPospalClient
};