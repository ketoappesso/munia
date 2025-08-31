// schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RedEnvelopeStatus } from './red-envelope.interface';

@Schema()
export class RedEnvelope extends Document {
  @Prop({ type: String, required: true })
  from: string; // 发送人的uin

  @Prop({ type: String })
  to: string; // 接收者uin， 可为空，如果不为空，则只有接受者可以被领取，否则可以被所有人领取。

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  chatId: string; // 归属于哪一个聊天，可为空。

  @Prop({ type: Number })
  expiredData: number; // 时间戳格式

  @Prop({ type: Number })
  status: RedEnvelopeStatus;

  @Prop({ type: String })
  remark: string; // 留言备注
}

export const RedEnvelopeSchema = SchemaFactory.createForClass(RedEnvelope);
