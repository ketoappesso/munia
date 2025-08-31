import { MessageResp } from '../message/message.interface';
import { RedEnvelope } from '../red-envelope/red-envelope.schema';

export type ChatResp = {
  chatId: string;
  selfInfo: {
    uin: string;
    name: string;
    photoPath: string;
  };
  otherInfo: {
    uin: string;
    name: string;
    photoPath: string;
  };
  selfUnreadMessageCount: number; // 用户a的未读消息数量
  otherUnreadMessageCount: number; // 用户b的未读消息数量
  lastMessage: MessageResp<RedEnvelope>; // 最后一条消息
};

export type GetChatListReq = {
  offset: number;
  count: number;
};

export type GetChatListResp = {
  chatList: ChatResp[];
  total: number;
};

export type GetChatDetailReq = {
  offset: number;
  count: number;
  chatId: string;
};

export type GetChatDetailsResp = {
  messages: {
    messageList: MessageResp<RedEnvelope>[];
    total: number;
  };
  chatId: string;
  userAUin: string;
  userBUin: string;
  userAName: string;
  userBName: string;
  userAPhotoPath: string;
  userBPhotoPath: string;
};
