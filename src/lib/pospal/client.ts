import crypto from 'crypto';
import JSONBigLib from 'json-bigint';

const JSONBig = JSONBigLib as any;

// Pospal API configuration
const POSPAL_BASE_URL = 'https://area20-win.pospal.cn/pospal-api2/openapi/v1';

// Main store (ZD) configuration only
const MAIN_STORE_CONFIG = {
  appId: '425063AC22F21CCD8E293004DDD8DA95',
  name: '总店'
};

// Response types
interface PospalResponse<T> {
  status: 'success' | 'error';
  messages: string[];
  data: T;
}

export interface CustomerInfo {
  customerUid: string | any; // Can be string or BigInt from API
  number: string;
  name: string;
  balance: number;
  point: number;
  phone: string;
  discount: number;
  enable: number;
  createdDate: string;
  extInfo?: {
    photoPath?: string;
    nickName?: string;
    totalPoint?: number;
    creditLimit?: number;
    subsidyAmount?: number;
    sex?: number;
    weixinOpenIds?: Array<{
      openId: string;
      openIdType: number;
    }>;
  };
}

export class PospalAPIClient {
  private appId: string;
  private appKey: string;
  private storeName: string;

  constructor() {
    this.appId = MAIN_STORE_CONFIG.appId;
    this.appKey = process.env.POSPAL_ZD_APPKEY || '';
    this.storeName = MAIN_STORE_CONFIG.name;
    
    if (!this.appKey) {
      console.warn('POSPAL_ZD_APPKEY not found in environment variables');
    }
  }

  /**
   * Generate MD5 signature for API request
   */
  private generateSignature(payload: any): string {
    const JSONBigInstance = JSONBig({ useNativeBigInt: true });
    const signatureBase = this.appKey + JSONBigInstance.stringify(payload);
    return crypto.createHash('md5').update(signatureBase, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * Make API request to Pospal
   */
  private async makeRequest<T>(endpoint: string, payload: any): Promise<T> {
    const JSONBigInstance = JSONBig({ useNativeBigInt: true });
    const signature = this.generateSignature(payload);
    const timestamp = Date.now().toString();

    const response = await fetch(`${POSPAL_BASE_URL}/${endpoint}`, {
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
      throw new Error(`Pospal API request failed: ${response.statusText}`);
    }

    const responseText = await response.text();
    const result: PospalResponse<T> = JSONBigInstance.parse(responseText);

    if (result.status !== 'success') {
      throw new Error(`Pospal API error: ${result.messages.join(', ')}`);
    }

    return result.data;
  }

  /**
   * Query customer by phone number
   */
  async queryCustomerByPhone(phone: string): Promise<CustomerInfo | null> {
    try {
      if (!this.appKey) {
        console.log('API key not configured, returning null');
        return null;
      }

      const payload = {
        appId: this.appId,
        customerTel: phone,  // Use customerTel as per the API docs
      };

      // Use the correct endpoint name from the backend code
      const result = await this.makeRequest<CustomerInfo[]>('customerOpenapi/queryBytel', payload);

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
      return null;
    }
  }

  /**
   * Query customer by member number
   */
  async queryCustomerByNumber(memberNumber: string): Promise<CustomerInfo | null> {
    try {
      const payload = {
        appId: this.appId,
        customerNum: memberNumber,
      };

      const result = await this.makeRequest<CustomerInfo>('customerOpenApi/queryByNumber', payload);
      return result;
    } catch (error) {
      console.error('Error querying customer by number:', error);
      return null;
    }
  }

  /**
   * Update customer balance and points
   */
  async updateBalanceAndPoints(
    customerUid: string | bigint,
    balanceIncrement: number,
    pointIncrement: number = 0,
    reason: string = 'Munia transaction'
  ): Promise<boolean> {
    try {
      if (!this.appKey) {
        console.error('API key not configured');
        return false;
      }

      // Convert customerUid to BigInt if it's a string
      const uid = typeof customerUid === 'string' ? BigInt(customerUid) : customerUid;

      const payload = {
        appId: this.appId,
        customerUid: uid,
        balanceIncrement,
        pointIncrement,
        dataChangeTime: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
        validateBalance: 1, // 1 = validate balance, 0 = don't validate
      };

      const result = await this.makeRequest('customerOpenApi/updateBalancePointByIncrement', payload);
      console.log(`Balance updated for customer ${uid}: ${balanceIncrement} (reason: ${reason})`);
      return true;
    } catch (error) {
      console.error('Error updating balance and points:', error);
      return false;
    }
  }

  /**
   * Get customer balance by phone number only
   */
  async getCustomerBalance(phoneNumber: string): Promise<number> {
    try {
      if (!phoneNumber || phoneNumber.trim() === '') {
        console.log('No phone number provided');
        return 0;
      }

      // Only query by phone number
      const customer = await this.queryCustomerByPhone(phoneNumber.trim());

      if (customer) {
        // Return total balance including subsidy if available
        const mainBalance = customer.balance || 0;
        const subsidyBalance = customer.extInfo?.subsidyAmount || 0;
        const totalBalance = mainBalance + subsidyBalance;
        console.log(`Found balance for ${phoneNumber}: ${totalBalance} (main: ${mainBalance}, subsidy: ${subsidyBalance})`);
        return totalBalance;
      }

      console.log(`No customer found for phone: ${phoneNumber}`);
      return 0;
    } catch (error) {
      console.error('Error getting customer balance:', error);
      return 0;
    }
  }

  /**
   * Get store name
   */
  getStoreName(): string {
    return this.storeName;
  }
}

// Export a factory function to create client for main store only
export function createPospalClient(): PospalAPIClient {
  return new PospalAPIClient();
}
