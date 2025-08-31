import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TimelineTweet extends Document {
  @Prop({ required: true })
  uin: string;
  @Prop({ type: String })
  text: string;

  @Prop({ required: true, type: Number })
  sendTime: number;

  @Prop({ type: String })
  location: string;

  @Prop({ enum: ['Content', 'Advertisement'], required: true })
  tweetType: string;

  @Prop({ required: true, type: Number })
  singlePrice: number;

  @Prop({ required: true, type: Number })
  likes: number;

  @Prop({ required: true, type: Number })
  replies: number;

  @Prop()
  totalInvestment: number;

  @Prop({ type: [String], required: true })
  imgs: string[];
}

export const TimelineTweetSchema = SchemaFactory.createForClass(TimelineTweet);
