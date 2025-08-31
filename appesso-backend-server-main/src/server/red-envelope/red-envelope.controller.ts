import { Body, Request, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RedEnvelopeService } from './red-envelope.service';
import {
  CreateRedEnvelopeReq,
  CreateRedEnvelopeResp,
  GetRedEnvelopeDetailReq,
  GetRedEnvelopeDetailResp,
  ReceiveRedEnvelopeReq,
  ReceiveRedEnvelopeResp,
} from './red-envelope.interface';
import { CustomerError, generateResponce } from 'src/utils';
import { StatusCode } from 'src/types/responce';
import { TokenInfo } from '../auth/auth.interface';

@Controller('red-envelope')
export class RedEnvelopeController {
  constructor(private readonly redEnvelopeService: RedEnvelopeService) {}
  @UseGuards(AuthGuard('jwt'))
  @Post('createRedEnvelope')
  async createRedEnvelope(
    @Body() body: CreateRedEnvelopeReq,
    @Request() req: { user: TokenInfo },
  ) {
    try {
      const from = req.user.uin;
      const to = body.to;
      const price = body.price;
      const chatId = body.chatId;
      const remark = body.remark;
      if (typeof price !== 'number') {
        return generateResponce<null>(
          null,
          '缺少字段price或字段不为整数',
          StatusCode.FIELD_ERROR,
        );
      }
      if (!Number.isInteger(price)) {
        return generateResponce<null>(
          null,
          '缺少字段price或字段不为整数',
          StatusCode.FIELD_ERROR,
        );
      }
      const res = await this.redEnvelopeService.createRedEnvelope({
        from,
        to,
        price,
        chatId,
        remark,
      });
      return generateResponce<CreateRedEnvelopeResp>(res);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('receiveRedEnvelope')
  async receiveRedEnvelope(
    @Body() body: ReceiveRedEnvelopeReq,
    @Request() req: { user: TokenInfo },
  ) {
    try {
      const res = await this.redEnvelopeService.receiveRedEnvelope(
        body,
        req.user.uin,
      );
      return generateResponce<ReceiveRedEnvelopeResp>(res);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
  /**
   * @todo
   * 获取红包信息接口待完善
   * service方法直接用byId那个。
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('getRedEnvelopeInfo')
  async getRedEnvelopeInfo(@Body() body: GetRedEnvelopeDetailReq) {
    try {
      const id = body.redEnvelopeId;
      if (!id) {
        return generateResponce<null>(
          null,
          '缺少字段：redEnvelopeId',
          StatusCode.FIELD_ERROR,
        );
      }
      const res = await this.redEnvelopeService.getRedEnvelopeInfo(id);
      return generateResponce<GetRedEnvelopeDetailResp>(res);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
}
