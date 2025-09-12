import { generatePospalHeaders, formatPospalDate } from './pospal-signature';
import {
  PospalConfig,
  PospalCustomer,
  PospalResponse,
  QueryByPhoneRequest,
  QueryByNumberRequest,
  QueryByUidRequest,
  UpdateBalancePointRequest,
  UpdateBalancePointResponse,
  CustomerCategory,
} from './pospal-types';

export class PospalClient {
  private config: PospalConfig;

  constructor(config?: Partial<PospalConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.POSPAL_API_URL || 'https://area20-win.pospal.cn:443',
      appId: config?.appId || process.env.POSPAL_APP_ID || '',
      appKey: config?.appKey || process.env.POSPAL_APP_KEY || '',
    };
    
    if (!this.config.appId || !this.config.appKey) {
      throw new Error('Pospal API credentials are required');
    }
  }

  /**
   * Query member by phone number
   * @param phoneNumber - Customer phone number
   * @returns Customer information array (may have multiple if phone is shared)
   */
  async queryByPhone(phoneNumber: string): Promise<PospalCustomer[]> {
    const url = `${this.config.apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`;
    const headers = generatePospalHeaders(this.config.appId, this.config.appKey);
    
    const body: QueryByPhoneRequest = {
      appId: this.config.appId,
      customerTel: phoneNumber,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: PospalResponse<PospalCustomer[]> = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.messages?.join(', ') || 'Query failed');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error querying Pospal member by phone:', error);
      throw error;
    }
  }

  /**
   * Query member by member number
   * @param memberNumber - Customer member number
   * @returns Customer information
   */
  async queryByNumber(memberNumber: string): Promise<PospalCustomer | null> {
    const url = `${this.config.apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryByNumber`;
    const headers = generatePospalHeaders(this.config.appId, this.config.appKey);
    
    const body: QueryByNumberRequest = {
      appId: this.config.appId,
      customerNum: memberNumber,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: PospalResponse<PospalCustomer> = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.messages?.join(', ') || 'Query failed');
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Error querying Pospal member by number:', error);
      throw error;
    }
  }

  /**
   * Query member by UID
   * @param customerUid - Customer UID in Pospal system
   * @returns Customer information
   */
  async queryByUid(customerUid: number): Promise<PospalCustomer | null> {
    const url = `${this.config.apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryByUid`;
    const headers = generatePospalHeaders(this.config.appId, this.config.appKey);
    
    const body: QueryByUidRequest = {
      appId: this.config.appId,
      customerUid,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: PospalResponse<PospalCustomer> = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.messages?.join(', ') || 'Query failed');
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Error querying Pospal member by UID:', error);
      throw error;
    }
  }

  /**
   * Update member balance and points
   * @param customerUid - Customer UID
   * @param balanceIncrement - Balance change amount (negative for deduction)
   * @param pointIncrement - Point change amount (negative for deduction)
   * @returns Update result
   */
  async updateBalanceAndPoints(
    customerUid: number,
    balanceIncrement?: number,
    pointIncrement?: number
  ): Promise<UpdateBalancePointResponse> {
    const url = `${this.config.apiUrl}/pospal-api2/openapi/v1/customerOpenApi/updateBalancePointByIncrement`;
    const headers = generatePospalHeaders(this.config.appId, this.config.appKey);
    
    const body: UpdateBalancePointRequest = {
      appId: this.config.appId,
      customerUid,
      balanceIncrement,
      pointIncrement,
      dataChangeTime: formatPospalDate(new Date()),
      validateBalance: 1,
      validatePoint: 1,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: PospalResponse<UpdateBalancePointResponse> = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.messages?.join(', ') || 'Update failed');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error updating Pospal member balance/points:', error);
      throw error;
    }
  }

  /**
   * Query all customer categories (member levels)
   * @returns Array of customer categories
   */
  async queryAllCategories(): Promise<CustomerCategory[]> {
    const url = `${this.config.apiUrl}/pospal-api2/openapi/v1/customerOpenApi/queryAllCustomerCategory`;
    const headers = generatePospalHeaders(this.config.appId, this.config.appKey);
    
    const body = {
      appId: this.config.appId,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: PospalResponse<CustomerCategory[]> = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.messages?.join(', ') || 'Query failed');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error querying Pospal categories:', error);
      throw error;
    }
  }

  /**
   * Get member level and expiry for a phone number
   * @param phoneNumber - Phone number to query
   * @returns Member level and expiry information
   */
  async getMemberStatus(phoneNumber: string): Promise<{
    isValid: boolean;
    level: string;
    expiryDate: string | null;
    balance: number;
    points: number;
    isApeLord: boolean;
  }> {
    try {
      const members = await this.queryByPhone(phoneNumber);
      
      if (!members || members.length === 0) {
        return {
          isValid: false,
          level: '非会员',
          expiryDate: null,
          balance: 0,
          points: 0,
          isApeLord: false,
        };
      }
      
      // Get the first member (assuming one phone = one member)
      const member = members[0];
      
      // Check if membership is valid
      const isValid = member.enable === 1 && 
        (!member.expiryDate || new Date(member.expiryDate) > new Date());
      
      // Check if it's Ape Lord member
      const isApeLord = member.categoryName?.includes('猿佬') || false;
      
      return {
        isValid,
        level: member.categoryName || '普通会员',
        expiryDate: member.expiryDate || null,
        balance: member.balance || 0,
        points: member.point || 0,
        isApeLord,
      };
    } catch (error) {
      console.error('Error getting member status:', error);
      return {
        isValid: false,
        level: '查询失败',
        expiryDate: null,
        balance: 0,
        points: 0,
        isApeLord: false,
      };
    }
  }
}

// Export singleton instance
export const pospalClient = new PospalClient();