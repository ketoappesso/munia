import { Document } from 'mongoose';
export interface ILog extends Document {
  readonly number: string;
  readonly customerUid: number; // 会员唯一编号
  readonly name: string;
  readonly phone: string;
}
