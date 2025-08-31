// schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ type: String, required: true })
  number: string; // 会员号

  @Prop({ type: String })
  customerUid: string; // 银豹系统唯一标识符

  @Prop({ type: String })
  categoryName: string; //会员名，高级会员 = 猿佬

  @Prop({ type: String, required: true })
  name: string; // 名字

  @Prop({ type: String, required: true })
  phone: string; // 电话号码

  @Prop({ type: String })
  birthday: string; // 生日

  @Prop({ type: String })
  expiryDate: string; // 会员过期时间

  @Prop({ type: String })
  uin: string; // 微信uin

  @Prop({ type: Number })
  count: number; // 可以二维码开门的次数

  @Prop({ type: Number })
  balance: number; // 余额

  @Prop({ type: String })
  photoPath: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
