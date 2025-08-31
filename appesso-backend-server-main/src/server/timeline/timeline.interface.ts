export enum TweetType {
  Content = 'Content',
  Advertisement = 'Advertisement',
}
export type CreateTimelineTweetReq = {
  tweetType: TweetType; // 推文的类型，使用枚举值
  text: string; // 推文的文字信息
  imgs: string[];
  singlePrice: number; // 单次价格
  totalInvestment?: number; // 广告投放的总金额 (可选)
};

export type GetTimelineTweetListReq = {
  count: number;
  offset: number;
};

export type GetTimelineTweetItemResp = {
  uin: string;
  photoPath: string;
  text: string;
  sendTime: number;
  location: string;
  tweetType: string;
  singlePrice: number;
  likes: number;
  replies: number;
  totalInvestment: number;
  imgs: string[];
};

export type LikeTweetReq = {
  id: string;
};
