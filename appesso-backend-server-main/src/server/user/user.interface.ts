export interface User {
  number: string;
  customerUid: string;
  photoPath: string;
  categoryName: string;
  name: string;
  phone: string;
  birthday: string;
  expiryDate: null | string;
  uin: string;
  count: number;
  balance: number;
}

export type GetUserInfoFromRemoteReq = {
  code: string;
  phone?: string;
};

export type GetUserInfoFromRemoteResp = User;

export type getSmsCodeReq = {
  phone: string;
};

export type LoginWithSmsCodeReq = {
  smsCode: string;
  phone: string;
};

export type LoginWithSmsCodeResp = User;

export type GetUserInfoReq = {
  uin: string; // 这里需要uin, 聊天界面可以拉对方的头像和名字
};

export type GetUserInfoResp = User;
