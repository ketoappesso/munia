import { RedEnvelope } from '../red-envelope/red-envelope.schema';

export enum MessageType {
  RedEnvelope = 'RedEnvelope',
  Text = 'Text',
}
export type MessageResp<T> = {
  from: string; // 发送人uin
  to: string; // 接收人uin
  createTime: number; // 创建时间(时间戳毫秒数)
  messageType: MessageType; // 消息类型
  messageInfo: T; // 信息内容。
  messageId: string;
  chatId: string;
};

export type GetMessagesListResp = {
  messages: MessageResp<RedEnvelope>[];
  total: number;
};
