import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.interface';
import { CustomerError, logs } from 'src/utils';
import { StatusCode } from 'src/types/responce';
import { PaspalService } from '../paspal/paspal.service';
import { WxSdkService } from '../wxsdk/wxsdk.service';
import * as Sms from 'tencentcloud-sdk-nodejs-sms';
import { ApiNames, QueryByNumberResp } from '../paspal/paspal.interface';
import { ConfigService } from '@nestjs/config';
import { SmsCode } from './sms.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('SmsCode')
    private readonly smsCodeModel: Model<SmsCode>,
    private readonly paspalService: PaspalService,
    private readonly wxSdkService: WxSdkService,
    private configService: ConfigService,
  ) {}
  private readonly logger = new Logger(UserService.name);
  async findUserInfoWithUin(uin: string): Promise<User | null> {
    try {
      if (!uin) {
        return null;
      }
      const filter = { uin };
      const user = await this.userModel.findOne(filter);
      return user;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        logs('---findUserInfoWithUin_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async findUserWithPhone(phone: string): Promise<User | null> {
    try {
      const filter = { phone };
      const user = await this.userModel.findOne(filter);
      return user;
    } catch (e) {
      logs('---findUserWithPhone_error---', e);
      if (e instanceof CustomerError) {
        throw e;
      } else {
        logs('---findUserWithPhone_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }

  async getUserInfo(uin: string): Promise<User | null> {
    try {
      const filter = { uin };
      const user = await this.userModel.findOne(filter);
      const phone = user.phone;
      const infoList = await this.paspalService.request(ApiNames.QueryByPhone, {
        customerTel: phone,
      });
      let remoteInfo: QueryByNumberResp | null = null;
      if (infoList && infoList.length) {
        remoteInfo = infoList[0];
      } else {
        throw new CustomerError('用户未注册', StatusCode.NOT_REGISTERED);
      }
      user.balance = remoteInfo.balance;
      (user.photoPath = remoteInfo.extInfo?.photoPath
        ? `https://imgw.pospal.cn/${remoteInfo.extInfo.photoPath}`
        : ''),
        (user.name = remoteInfo.name);
      await user.save();
      return user;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        logs('---getUserInfo_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async getUserInfosByUins(uins: string[]): Promise<User[]> {
    try {
      const users = this.userModel.find({ uin: { $in: uins } });
      return users;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        logs('---getUserInfosByUins_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }

  async getUserInfoByUin(uin: string): Promise<User> {
    try {
      const user = this.userModel.findOne({ uin });
      return user;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        logs('---getUserInfoByUin_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async getUserInfoFromRemote(
    code: string,
    uin: string,
    tel?: string,
  ): Promise<User> {
    const phone = tel || (await this.wxSdkService.getWxPhone(code));
    const filter = { phone };
    const infoList =
      (await this.paspalService.request(ApiNames.QueryByPhone, {
        customerTel: phone,
      })) || [];
    const localUserInfo = await this.findUserWithPhone(uin);
    let remoteInfo: QueryByNumberResp | null = null;
    if (infoList && infoList.length) {
      remoteInfo = infoList[0];
    } else {
      return {
        customerUid: '',
        number: '',
        categoryName: '',
        name: '',
        phone: phone,
        birthday: '',
        expiryDate: '',
        uin,
        balance: 0,
        count: 0,
        photoPath: '',
      };
    }
    const userInfo = {
      customerUid: remoteInfo.customerUid.toString(),
      number: remoteInfo.number,
      categoryName: remoteInfo.categoryName,
      name: remoteInfo.name,
      phone: remoteInfo.phone,
      birthday: remoteInfo.birthday,
      expiryDate: remoteInfo.expiryDate,
      uin,
      balance: remoteInfo.balance,
      count: localUserInfo ? localUserInfo.count : 50,
      photoPath: remoteInfo.extInfo?.photoPath
        ? `https://imgw.pospal.cn/${remoteInfo.extInfo.photoPath}`
        : '',
    };
    await this.userModel.updateOne(filter, userInfo, { upsert: true });
    return userInfo;
  }
  generateSMSCode() {
    const min = 0; // Minimum value for a 4-digit code
    const max = 999; // Maximum value for a 4-digit code
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber.toString().padStart(3, '0');
  }
  async getSmsCode(phone: string) {
    let smsCodeDocument = await this.smsCodeModel.findOne({ phone });
    if (
      smsCodeDocument &&
      smsCodeDocument.createTime >= Number(new Date()) - 1000 * 60
    ) {
      throw new CustomerError(
        '间隔时间太短',
        StatusCode.REQUEST_INTERVAL_TOO_SHORT,
      );
    }
    const smsCode = this.generateSMSCode();
    if (!smsCodeDocument) {
      smsCodeDocument = new this.smsCodeModel({
        phone,
        createTime: Number(new Date()),
        expireIn: Number(new Date()) + 1000 * 60 * 5,
        code: smsCode,
        used: false,
      });
    } else {
      smsCodeDocument.code = smsCode;
      smsCodeDocument.createTime = Number(new Date());
      smsCodeDocument.expireIn = Number(new Date()) + 1000 * 60 * 5;
      smsCodeDocument.used = false;
    }
    const clientConfig = {
      credential: {
        secretId: this.configService.get('COS_SECRET_ID'),
        secretKey: this.configService.get('COS_SECRET_KEY'),
      },
      region: 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'sms.tencentcloudapi.com',
        },
      },
    };
    const SmsClient = Sms.sms.v20210111.Client;
    const client = new SmsClient(clientConfig);
    const params = {
      PhoneNumberSet: [phone],
      SmsSdkAppId: '1400849751',
      SignName: '猿素宇宙小程序',
      TemplateId: '1933630',
      TemplateParamSet: [smsCode, '5'],
    };
    const sendSmsRes = await client.SendSms(params);
    this.logger.log('---sendSmsRes---', sendSmsRes);
    this.logger.log(
      '---sendSmsRes?.SendStatusSet[0]?.Code---',
      sendSmsRes?.SendStatusSet[0]?.Code,
    );
    this.logger.log(sendSmsRes?.SendStatusSet[0]?.Code === 'Ok');
    if (sendSmsRes?.SendStatusSet[0]?.Code === 'Ok') {
      await smsCodeDocument.save();
      return true;
    } else {
      throw new CustomerError(
        sendSmsRes?.SendStatusSet[0]?.Code || '发生未知错误',
        StatusCode.OTHER,
      );
    }
  }

  async checkSmsCodeValid(phone: string, smsCode: string) {
    const smsCodeDocument = await this.smsCodeModel.findOne({ phone });
    if (!smsCodeDocument) {
      return false;
    }
    if (smsCodeDocument.code !== smsCode) {
      return false;
    }
    if (smsCodeDocument.expireIn <= Number(new Date())) {
      return false;
    }
    if (smsCodeDocument.used) {
      return false;
    }
    smsCodeDocument.used = true;
    await smsCodeDocument.save();
    return true;
  }
  async loginWithSmsCode(
    phone: string,
    smsCode: string,
    uin: string,
  ): Promise<User> {
    const smsValid = await this.checkSmsCodeValid(phone, smsCode);
    if (!smsValid) {
      throw new CustomerError('验证码不正确', StatusCode.SMS_CODE_INVALID);
    }
    const filter = { phone };
    const infoList =
      (await this.paspalService.request(ApiNames.QueryByPhone, {
        customerTel: phone,
      })) || [];
    const localUserInfo = await this.findUserWithPhone(uin);
    let remoteInfo: QueryByNumberResp | null = null;
    if (infoList && infoList.length) {
      remoteInfo = infoList[0];
    } else {
      return {
        customerUid: '',
        number: '',
        categoryName: '',
        name: '',
        phone: phone,
        birthday: '',
        expiryDate: '',
        uin,
        balance: 0,
        count: 0,
        photoPath: '',
      };
    }
    const userInfo = {
      customerUid: remoteInfo.customerUid.toString(),
      number: remoteInfo.number,
      categoryName: remoteInfo.categoryName,
      name: remoteInfo.name,
      phone: remoteInfo.phone,
      birthday: remoteInfo.birthday,
      expiryDate: remoteInfo.expiryDate,
      uin,
      balance: remoteInfo.balance,
      count: localUserInfo ? localUserInfo.count : 50,
      photoPath: remoteInfo.extInfo?.photoPath
        ? `https://imgw.pospal.cn/${remoteInfo.extInfo.photoPath}`
        : '',
    };
    await this.userModel.updateOne(filter, userInfo, { upsert: true });
    return userInfo;
  }
}
