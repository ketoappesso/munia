// Pospal API Types

export interface PospalConfig {
  apiUrl: string;
  appId: string;
  appKey: string;
}

export interface PospalApiHeaders {
  'User-Agent': string;
  'Content-Type': string;
  'accept-encoding': string;
  'time-stamp': string;
  'data-signature': string;
}

export interface PospalCustomer {
  customerUid: number;
  categoryName: string; // Member level (金卡, 银卡, 猿佬会员, etc.)
  number: string; // Member number
  name: string;
  point: number;
  discount: number;
  balance: number;
  phone: string;
  birthday?: string;
  qq?: string;
  email?: string;
  address?: string;
  remarks?: string;
  createdDate: string;
  onAccount: number;
  enable: number;
  password?: string;
  expiryDate?: string; // Membership expiry date
  createStoreAppIdOrAccount?: string;
  department?: string;
  weixinOpenIds?: Array<{
    openId: string;
    openIdType: number;
  }>;
  extInfo?: {
    sex?: number;
    lunarBirthday?: string;
    totalPoint?: number;
    creditLimit?: number;
    creditPeriod?: number;
    photoPath?: string;
    nickName?: string;
    subsidyAmount?: number;
  };
}

export interface PospalResponse<T> {
  status: 'success' | 'error';
  messages: string[];
  errorCode?: number;
  data: T;
}

export interface QueryByPhoneRequest {
  appId: string;
  customerTel: string;
  groupShare?: number;
  queryCustomerDepartment?: number;
}

export interface QueryByNumberRequest {
  appId: string;
  customerNum: string;
  groupShare?: number;
  queryCustomerDepartment?: number;
}

export interface QueryByUidRequest {
  appId: string;
  customerUid: number;
  groupShare?: number;
  queryCustomerDepartment?: number;
}

export interface UpdateBalancePointRequest {
  appId: string;
  customerUid: number;
  balanceIncrement?: number;
  pointIncrement?: number;
  dataChangeTime: string;
  validateBalance?: number;
  validatePoint?: number;
  remark?: string;
}

export interface UpdateBalancePointResponse {
  customerUid: number;
  balanceBeforeUpdate: number;
  balanceAfterUpdate: number;
  balanceIncrement: number;
  pointBeforeUpdate: number;
  pointAfterUpdate: number;
  pointIncrement: number;
  dataChangeTime: string;
  updateCustomerTime: string;
}

export interface CustomerCategory {
  name: string;
  discount: number;
  uid: number;
  enable: number;
  isPoint: number;
}

// Member levels enum
export enum MemberLevel {
  STANDARD = '普通会员',
  SILVER = '银卡',
  GOLD = '金卡',
  PLATINUM = '白金卡',
  DIAMOND = '钻石卡',
  APE_LORD = '猿佬会员', // Special member with access control privileges
}

// Helper function to check if member is Ape Lord
export function isApeLordMember(categoryName?: string): boolean {
  if (!categoryName) return false;
  return categoryName === MemberLevel.APE_LORD || categoryName.includes('猿佬');
}

// Helper function to check if membership is valid
export function isMembershipValid(expiryDate?: string): boolean {
  if (!expiryDate) return true; // No expiry means lifetime membership
  const expiry = new Date(expiryDate);
  return expiry > new Date();
}