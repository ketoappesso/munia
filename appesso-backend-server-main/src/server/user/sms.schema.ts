// schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class SmsCode extends Document {
  @Prop({ type: String, required: true })
  phone: string; // 手机号

  @Prop({ type: String })
  code: string; // 验证码

  @Prop({ type: Number })
  createTime: number; // 创建时间时间
  @Prop({ type: Number })
  expireIn: number; // 过期时间

  @Prop({ type: Boolean })
  used: boolean; // 是否被勇敢
}

export const SmsCodeSchema = SchemaFactory.createForClass(SmsCode);
