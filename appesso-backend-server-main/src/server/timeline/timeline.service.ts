import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { TimelineTweet } from './timeline.schema';
import { GetTimelineTweetItemResp, TweetType } from './timeline.interface';
import { PaspalService } from '../paspal/paspal.service';
import { ApiNames, IsValidateBalance } from '../paspal/paspal.interface';
import { CustomerError, formateDate } from 'src/utils';
import { StatusCode } from 'src/types/responce';

@Injectable()
export class TimeLineService {
  constructor(
    @InjectModel('TimelineTweet')
    private readonly timelineTweet: Model<TimelineTweet>,
    private readonly usersService: UserService,
    private readonly paspalService: PaspalService,
  ) {}
  private readonly logger = new Logger(TimeLineService.name);

  async createTimelineTweet(
    uin: string,
    text: string,
    imgs: string[],
    tweetType: TweetType,
    singlePrice,
    totalInvestment,
  ) {
    const newTweet = new this.timelineTweet({
      uin,
      text,
      imgs,
      tweetType,
      singlePrice,
      likes: 0,
      replies: 0,
      totalInvestment,
      sendTime: Number(new Date()),
      location: '未知',
    });
    if (tweetType === TweetType.Advertisement) {
      const user = await this.usersService.findUserInfoWithUin(uin);
      const uid = user.customerUid;
      const deducteResult = await this.paspalService.request(
        ApiNames.UpdateBalancePointByIncrement,
        {
          customerUid: BigInt(uid),
          dataChangeTime: formateDate(new Date()),
          validateBalance: IsValidateBalance.TRUE,
          balanceIncrement: -totalInvestment,
        },
      );
      if (!deducteResult) {
        throw new CustomerError('扣减余额失败', StatusCode.OTHER);
      }
    }
    await newTweet.save();
    return newTweet._id.toString();
  }

  async getTimelineList(count: number, offset: number) {
    const timeLineList = await this.timelineTweet
      .find()
      .sort({ sendTime: -1 })
      .skip(offset)
      .limit(count)
      .exec();
    const promises = timeLineList.map((item) => {
      return this.usersService.findUserInfoWithUin(item.uin);
    });
    const users = await Promise.all(promises);
    const res: GetTimelineTweetItemResp[] = timeLineList.map((item, index) => {
      return {
        ...item,
        photoPath: users[index]?.photoPath,
      };
    });
    return res;
  }

  async likeTweet(id) {
    const tweet = await this.timelineTweet.findById(id);
    tweet.likes = tweet.likes + 1;
    await tweet.save();
    return 0;
  }
}
