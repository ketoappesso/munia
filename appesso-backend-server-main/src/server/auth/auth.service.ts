import { Injectable, Logger } from '@nestjs/common';
import { CustomerError } from 'src/utils';
import { StatusCode } from 'src/types/responce';
import { JwtService } from '@nestjs/jwt';
import { LoginWithCodeResp } from './auth.interface';
import { UserService } from '../user/user.service';
import { WxSdkService } from '../wxsdk/wxsdk.service';
import config from '../../../config';

@Injectable()
export class AuthService {
  conf: {
    WX_SECERT: string;
    PASPAL_ZD: string;
    PASPAL_GFKD: string;
    PASPAL_WDY: string;
    PASPAL_YRMT: string;
    PASPAL_LGRJYY: string;
    PASPAL_WK: string;
    PASPAL_HH: string;
    PASPAL_XHGJ: string;
    JWT_SECRET: string;
  };
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly wxSdkService: WxSdkService,
  ) {
    this.conf = config();
  }
  private readonly logger = new Logger(AuthService.name);
  async loginWithCode(code: string): Promise<LoginWithCodeResp | null> {
    try {
      const uin = await this.wxSdkService.getWxUin(code);
      const userInfo = await this.usersService.findUserInfoWithUin(uin);
      const isNeedLoginWithPhone = userInfo?.customerUid ? false : true;
      const token = this.generateToken(uin);
      return {
        uin,
        token,
        isNeedLoginWithPhone,
      };
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('------loginWithCode_error------', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  generateToken(uin: string): string {
    return this.jwtService.sign(
      {
        uin: uin,
      },
      {
        secret: this.conf.JWT_SECRET,
        expiresIn: '7d',
      },
    );
  }
  decodeToken(token: string): { uin: string } {
    return this.jwtService.decode(token) as { uin: string };
  }
}
