import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import {
  GetUserInfoReq,
  User,
  GetUserInfoFromRemoteReq,
  getSmsCodeReq,
  LoginWithSmsCodeReq,
} from './user.interface';
import { CustomerError, generateResponce, logs } from 'src/utils';
import { StatusCode } from 'src/types/responce';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { TokenInfo } from '../auth/auth.interface';

@Controller('user')
export class UserController {
  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly userService: UserService,
  ) {}
  private readonly logger = new Logger(UserController.name);
  @Post('check')
  async checkUserInfo(
    @Body() body: { number: string },
  ): Promise<{ result: boolean }> {
    try {
      const number = body.number;
      const checkResult = await this.accessControlService.checkUserInfo(number);
      return {
        result: checkResult,
      };
    } catch (e) {
      return {
        result: false,
      };
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('getUserInfo')
  async getUserInfo(@Body() body: GetUserInfoReq) {
    try {
      const uin = body.uin;
      if (!uin) {
        return generateResponce<null>(
          null,
          '缺少字段: uin',
          StatusCode.FIELD_ERROR,
        );
      }
      const userInfo = await this.userService.getUserInfo(uin);
      return generateResponce<User>(userInfo);
    } catch (e) {
      logs('---getUserInfo---', e);
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('getUserInfoFromRemote')
  async GetUserInfoFromRemote(
    @Request() req: { user: TokenInfo },
    @Body() body: GetUserInfoFromRemoteReq,
  ) {
    try {
      const code = body.code;
      const phone = body.phone;
      if (!code && !phone) {
        return generateResponce<null>(
          null,
          '缺少字段: code或phone必须二选一',
          StatusCode.FIELD_ERROR,
        );
      }
      const uin = req.user.uin;
      const userInfo = await this.userService.getUserInfoFromRemote(
        code,
        uin,
        phone,
      );
      if (!userInfo.customerUid) {
        return generateResponce<User>(
          userInfo,
          '用户未注册',
          StatusCode.NOT_REGISTERED,
        );
      } else {
        return generateResponce<User>(userInfo);
      }
    } catch (e) {
      logs('---GetUserInfoFromRemote---', e);
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('getSmsCode')
  async getSmsCode(
    @Request() req: { user: TokenInfo },
    @Body() body: getSmsCodeReq,
  ) {
    try {
      if (!body.phone) {
        return generateResponce<null>(
          null,
          '缺少字段: phone',
          StatusCode.FIELD_ERROR,
        );
      }
      await this.userService.getSmsCode(body.phone);
      return generateResponce<string>('发送成功');
    } catch (e) {
      if (e instanceof CustomerError) {
        return generateResponce<null>(null, e.message, e.code);
      } else {
        this.logger.error('------loginWithSmsCode------', e);
        return generateResponce<null>(
          null,
          '发生未知错误，请联系后台',
          StatusCode.OTHER,
        );
      }
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('loginWithSmsCode')
  async loginWithSmsCode(
    @Request() req: { user: TokenInfo },
    @Body() body: LoginWithSmsCodeReq,
  ) {
    try {
      if (!body.phone || !body.smsCode) {
        return generateResponce<null>(
          null,
          '缺少字段: phone或code',
          StatusCode.FIELD_ERROR,
        );
      }
      const res = await this.userService.loginWithSmsCode(
        body.phone,
        body.smsCode,
        req.user.uin,
      );
      if (!res.customerUid) {
        return generateResponce<User>(
          res,
          '用户未注册',
          StatusCode.NOT_REGISTERED,
        );
      }
      return generateResponce<User>(res);
    } catch (e) {
      if (e instanceof CustomerError) {
        // throw e;
        return generateResponce<null>(null, e.message, e.code);
      } else {
        this.logger.error('------loginWithSmsCode------', e);
        return generateResponce<null>(
          null,
          '发生未知错误，请联系后台',
          StatusCode.OTHER,
        );
      }
    }
  }
}
