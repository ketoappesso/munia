export type WxAccessToken = {
  access_token: string;
  expires_in: number;
};

export type WxLogin = {
  session_key: string;
  unionid: string;
  errmsg: string;
  openid: string;
  errcode: number;
};

export type WxPhoneNumber = {
  errmsg: string;
  errcode: number;
  phone_info: {
    phoneNumber: string; // 国外手机号会有+xx区号
    purePhoneNumber: string; // 没有区号的纯手机号
    countryCode: string; // 区号
  };
};
