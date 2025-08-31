// schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Chat extends Document {
  @Prop({ type: String })
  userA: string; // 一方用户uin

  @Prop({ type: String })
  userB: string; // 另一方用户uin

  @Prop({ type: Number })
  createTime: number; // 创建时间(时间戳毫秒数)
  @Prop({ type: Number })
  updateTime: number; // 最后一次时间(时间戳毫秒数)

  @Prop({ type: Number })
  userAUnreadMessageCount: number;

  @Prop({ type: Number })
  userBUnreadMessageCount: number;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
