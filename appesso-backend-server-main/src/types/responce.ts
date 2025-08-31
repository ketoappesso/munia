export type ResponceType<T> = {
  message: string;
  statusCode: StatusCode;
  body: T;
};

export enum StatusCode {
  SUCCESS = 0, // 成功
  FIELD_ERROR = 1, // 传入字段错误
  NOT_REGISTERED = 2, // 用户未注册
  WXAPI_ERROR = 4, // 微信调用失败
  NOT_ENOUGH = 5, // 余额不足
  HAS_EXPIRED = 6, // 红包已过期
  PASPAY_ERROR = 7, // 银豹错误
  CAN_NOT_RECEIVE = 8, // 无法领取
  REQUEST_INTERVAL_TOO_SHORT = 9, // 请求间隔太短
  SMS_CODE_INVALID = 10, // 验证码错误
  FORBIDEN = 401, // 无用户token或token过期
  OTHER = 10000, // 其他错误，后续可细分
}

export type getChatDetailReq = {
  chatId: string;
  offset: number;
  count: number;
};

// export type getChatDetailResp = {
//   messageList: Message<RedEnvelopeMessage>[]; // 后续这里可加入文字消息支持。
// };
