export type LoginWithCodeReq = {
  code: string;
};

export type LoginWithCodeResp = {
  uin: string;
  token: string;
  isNeedLoginWithPhone: boolean; // 是否需要授权手机号码
};

export type TokenInfo = {
  uin: string;
};
