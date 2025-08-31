// schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MessageType } from './message.interface';
// import { RedEnvelopeStatus } from './red-envelope.interface';

@Schema()
export class Message extends Document {
  @Prop({ type: String })
  from: string; // 发送人uin

  @Prop({ type: String })
  to: string; // 接收人uin

  @Prop({ type: Number })
  createTime: number; // 创建时间(时间戳毫秒数)

  @Prop({ type: String })
  messageType: MessageType; // 消息类型

  @Prop({ type: String })
  releationId: string; // 关联的信息内容对应的id，如果类型为红包则是红包id，如果是文本则是文本id。

  @Prop({ type: String })
  chatId: string; // 关联的聊天列表id。
}

export const MessageSchema = SchemaFactory.createForClass(Message);
