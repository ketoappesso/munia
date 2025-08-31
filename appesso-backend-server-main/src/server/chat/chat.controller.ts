import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenInfo } from '../auth/auth.interface';
import {
  GetChatDetailReq,
  GetChatDetailsResp,
  GetChatListReq,
  GetChatListResp,
} from './chat.interface';
import { ChatService } from './chat.service';
import { CustomerError, generateResponce } from 'src/utils';
import { StatusCode } from 'src/types/responce';
// import { off } from 'process';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  /**
   * 需新增接口
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('getChatList')
  async getChatList(
    @Body() body: GetChatListReq,
    @Request() req: { user: TokenInfo },
  ) {
    try {
      if (typeof body.offset !== 'number' || typeof body.count !== 'number') {
        return generateResponce<null>(
          null,
          '缺乏分页参数或分页参数错误',
          StatusCode.FIELD_ERROR,
        );
      }
      const res = await this.chatService.findChatListForUser(
        req.user.uin,
        body.offset,
        body.count,
      );
      return generateResponce<GetChatListResp>(res);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('getChatDetail')
  async getChatDetail(
    @Body() body: GetChatDetailReq,
    @Request() req: { user: TokenInfo },
  ) {
    try {
      if (typeof body.offset !== 'number' || typeof body.count !== 'number') {
        return generateResponce<null>(
          null,
          '缺乏分页参数或分页参数错误',
          StatusCode.FIELD_ERROR,
        );
      }
      const res = await this.chatService.findChatDetailForUser(
        body.chatId,
        req.user.uin,
        body.offset,
        body.count,
      );
      return generateResponce<GetChatDetailsResp>(res);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
}
