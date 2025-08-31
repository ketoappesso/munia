import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { TimeLineService } from './timeline.service';
import { TokenInfo } from '../auth/auth.interface';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateTimelineTweetReq,
  GetTimelineTweetListReq,
  LikeTweetReq,
} from './timeline.interface';
import { CustomerError, generateResponce } from 'src/utils';
import { StatusCode } from 'src/types/responce';
@Controller('timeline')
export class TimeLineController {
  constructor(private readonly timeLineService: TimeLineService) {}
  private readonly logger = new Logger(TimeLineController.name);

  @UseGuards(AuthGuard('jwt'))
  @Post('createTweet')
  async createTweet(
    @Request() req: { user: TokenInfo },
    @Body() body: CreateTimelineTweetReq,
  ) {
    try {
      const uin = req.user.uin;
      const { tweetType, text, imgs, singlePrice, totalInvestment } = body;
      if (!tweetType) {
        return generateResponce<null>(
          null,
          '缺少字段: tweetType',
          StatusCode.FIELD_ERROR,
        );
      }
      const tweetId = await this.timeLineService.createTimelineTweet(
        uin,
        text || '',
        imgs || [],
        tweetType,
        singlePrice || 0,
        totalInvestment || 0,
      );
      return generateResponce<string>(tweetId);
    } catch (e) {
      // const err = e as CustomerError;
      if (e instanceof CustomerError) {
        return generateResponce<null>(null, e.message, e.code);
      } else {
        this.logger.error('---createTweet---', e);
        return generateResponce<null>(
          null,
          '发生未知错误，请联系后台',
          StatusCode.OTHER,
        );
      }
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('getTimeLineList')
  async getTimeLineList(@Body() body: GetTimelineTweetListReq) {
    try {
      const timelineList = this.timeLineService.getTimelineList(
        body.count,
        body.offset,
      );
      return timelineList;
    } catch (e) {
      if (e instanceof CustomerError) {
        return generateResponce<null>(null, e.message, e.code);
      } else {
        this.logger.error('---getTimeLineList---', e);
        return generateResponce<null>(
          null,
          '发生未知错误，请联系后台',
          StatusCode.OTHER,
        );
      }
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('likeTweet')
  async likeTweet(@Body() body: LikeTweetReq) {
    try {
      await this.timeLineService.likeTweet(body.id);
      return generateResponce<null>(null);
    } catch (e) {
      if (e instanceof CustomerError) {
        return generateResponce<null>(null, e.message, e.code);
      } else {
        this.logger.error('---likeTweet---', e);
        return generateResponce<null>(
          null,
          '发生未知错误，请联系后台',
          StatusCode.OTHER,
        );
      }
    }
  }
}
