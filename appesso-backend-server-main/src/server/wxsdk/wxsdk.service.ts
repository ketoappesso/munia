import { Injectable, Logger } from '@nestjs/common';
import { stringify } from 'json-bigint';
import { StatusCode } from 'src/types/responce';
import { CustomerError } from 'src/utils';
import * as superagent from 'superagent';
import { WxAccessToken, WxLogin, WxPhoneNumber } from './wxsdk.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WxSdkService {
  constructor(private configService: ConfigService) {
    this.secret = this.configService.get('WX_SECERT');
  }
  private readonly logger = new Logger(WxSdkService.name);
  accessToken = '';
  expired_at = NaN;
  appid = 'wx08cb02b3d6ed9e15';
  secret = '';
  public async getToken(): Promise<string> {
    if (this.accessToken) {
      const currentTime = Number(new Date());
      // 预留5s种buffer，防止因为网络延迟过期
      if (currentTime < this.expired_at - 5000) {
        return this.accessToken;
      }
    }
    try {
      const remoteTokenInfo = await this._getRemoteToken();
      this.accessToken = remoteTokenInfo.access_token;
      this.expired_at = Number(new Date()) + remoteTokenInfo.expires_in * 1000;
      return this.accessToken;
    } catch (e) {
      this.logger.error('---getToken_Error---', e);
      if (e instanceof CustomerError) {
        throw e;
      } else {
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  private async _getRemoteToken(): Promise<WxAccessToken> {
    try {
      const payload = {
        grant_type: 'client_credential',
        appid: this.appid,
        secret: this.secret,
      };
      const resp = await superagent
        .post('https://api.weixin.qq.com/cgi-bin/stable_token')
        .send(payload);
      const respBody = JSON.parse(resp.text) as WxAccessToken;
      if (respBody.access_token) {
        return respBody;
      } else {
        throw new CustomerError(stringify(respBody), StatusCode.WXAPI_ERROR);
      }
    } catch (e) {
      this.logger.error('---_getRemoteToken_Error---', e);
      if (e instanceof CustomerError) {
        throw e;
      } else {
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  public async getWxUin(code: string): Promise<string> {
    try {
      const resp = await superagent
        .get('https://api.weixin.qq.com/sns/jscode2session')
        .query({
          grant_type: 'authorization_code',
          appid: this.appid,
          secret: this.secret,
          js_code: code,
        });
      const respBody = JSON.parse(resp.text) as WxLogin;
      if (respBody.unionid) {
        return respBody.unionid;
      } else {
        throw new CustomerError(
          stringify({
            errmsg: respBody.errmsg,
            errcode: respBody.errcode,
          }),
          StatusCode.WXAPI_ERROR,
        );
      }
    } catch (e) {
      this.logger.error('---getWxUin_Error---', e);
      if (e instanceof CustomerError) {
        throw e;
      } else {
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  public async getWxPhone(code: string): Promise<string> {
    try {
      const access_token = await this.getToken();
      const resp = await superagent
        .post('https://api.weixin.qq.com/wxa/business/getuserphonenumber')
        .query({ access_token })
        .send({ code });
      const respBody = JSON.parse(resp.text) as WxPhoneNumber;
      if (respBody?.phone_info?.purePhoneNumber) {
        return respBody?.phone_info?.purePhoneNumber;
      } else {
        throw new CustomerError(
          stringify({
            errmsg: respBody.errmsg,
            errcode: respBody.errcode,
          }),
          StatusCode.WXAPI_ERROR,
        );
      }
    } catch (e) {
      this.logger.error('---getWxPhone_Error---', e);
      if (e instanceof CustomerError) {
        throw e;
      } else {
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
}
