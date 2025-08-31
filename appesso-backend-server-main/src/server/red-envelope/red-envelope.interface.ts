export type CreateRedEnvelopeReq = {
  to?: string; // 目标用户uin，如果不填则所有人可领
  chatId?: string; // 目标聊天，可以为空
  price: number; // 发红包的价格
  remark?: string;
};
export type CreateRedEnvelopeResp = {
  result: boolean; // 如果创建成功则为true
  redEnvelopeId: string; // 红包id
};

export type CreateRedEnvelopeServiceInput = {
  from: string;
  to?: string;
  chatId?: string;
  price: number;
  remark?: string;
};

export type ReceiveRedEnvelopeReq = {
  redEnvelopeId: string; // 红包id
};

export type ReceiveRedEnvelopeResp = {
  result: boolean; // 如果领取成功则为true
  chatId: string; // 创建新的对话、或者返回已有对话。
};

export enum RedEnvelopeStatus {
  UNKNOWN = 0, // 未知类型
  RECEIVED = 1, // 已领取
  NOT_RECEIVED = 2, // 未领取
  EXPIRED = 3, // 已过期
}

export type RedEnvelopeMessage = {
  from: string; // 发送人uin
  to: string; // 接收人uin
  price: number;
  status: RedEnvelopeStatus;
};

export type GetRedEnvelopeDetailReq = {
  redEnvelopeId: string;
};

export type GetRedEnvelopeDetailResp = {
  redEnvelopeId: string;
  fromUin: string; // 发送人的uin
  fromName: string; // 发送人名字
  fromPhotoPath: string; // 发送人头像。
  toUin: string; // 发送人的uin
  toName: string; // 发送人名字
  toPhotoPath: string; // 发送人头像。
  price: number;
  chatId: string; // 归属于哪一个聊天，可为空。
  expiredData: number; // 时间戳格式
  status: RedEnvelopeStatus; // 过期状态，没有redis做事件推送，状态刷新会不及时，需要前端自己根据时间戳判断是否过期
  remark: string;
};
