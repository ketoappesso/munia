import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { isExpired, stringify } from 'src/utils';
import { User } from './user.interface';
import { request } from 'express';
import { ApiNames } from '../paspal/paspal.interface';
import { PaspalService } from '../paspal/paspal.service';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly paspalService: PaspalService,
  ) {}
  private readonly logger = new Logger(AccessControlService.name);
  async checkUserInfo(number: string): Promise<boolean> {
    try {
      const filter = { number };
      const user = await this.userModel.findOne(filter);
      const authRoles = ['猿佬', '猿一', '猿七', '猿三零'];
      if (user && authRoles.includes(user?.categoryName)) {
        if (!isExpired(user?.expiryDate)) {
          if (user?.count >= 1) {
            this.logger.debug(
              `user number is ${number}, 基于本地数据库判断，允许开门`,
            );
            await this.decrementCountByNumber(number);
            return true;
          } else {
            this.logger.debug(
              `user number is ${number}, 基于本地数据库判断，次数不足，不允许开门`,
            );
            return false;
          }
        }
      }
      // 是会员 、 没有过期，任意条件不满足，上面不会return，到这里，走银豹远程接口。
      const remoteUserInfo = await this.getCustomerInfoFromRemote(number);
      this.updateUser(remoteUserInfo);
      if (
        remoteUserInfo.categoryName === '猿佬' ||
        remoteUserInfo.categoryName === '猿佬Plus' ||
        remoteUserInfo.categoryName === '猿佬plus'
      ) {
        if (!isExpired(remoteUserInfo.expiryDate)) {
          if (remoteUserInfo.count >= 1) {
            this.logger.debug(
              `user number is ${number}, 基于远程数据库判断，允许开门`,
            );
            await this.decrementCountByNumber(number);
            return true;
          } else {
            this.logger.debug(
              `user number is ${number}, 基于远程数据库判断，次数不足，不允许开门`,
            );
            return false;
          }
        }
      }
      this.logger.debug(
        `user number is ${number}, 基于远程数据库判断，无开门权限`,
      );
      return false;
    } catch (e) {
      this.logger.error('------checkUserInfo_error------', e);
    }
  }
  async decrementCountByNumber(number: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ number }).exec();

      if (!user) {
        console.error('User not found for the given number:', number);
        return null;
      }

      user.count -= 1;
      const updatedUser = await user.save();
      return updatedUser;
    } catch (error) {
      console.error('Error in decrementCountByNumber:');
    }
  }
  async getCustomerInfoFromRemote(number: string): Promise<User | null> {
    try {
      const info = await this.paspalService.request(ApiNames.QueryByNumber, {
        customerNum: number,
      });
      this.logger.debug(`request QueryByNumber, info is ${stringify(info)}`);
      return {
        number: info.number,
        customerUid: info.customerUid.toString(),
        categoryName: info.categoryName,
        uin: '',
        phone: info.phone,
        count: 50,
        balance: info.balance,
        name: info.name,
        birthday: info.birthday,
        expiryDate: info.expiryDate,
        photoPath: info.extInfo?.photoPath || '',
      };
    } catch (e) {
      this.logger.error(
        `request QueryByNumber error`,
        `error number is ${number}`,
        `error is ${e}`,
      );
      return null;
    }
  }
  async updateUser(user: User): Promise<User> {
    try {
      const oldUser = await this.userModel.findOne({ number: user.number });
      if (!oldUser) {
        this.logger.debug(
          `user number is ${user.number} 本地无用户信息，调用银豹接口，更新用户信息如下`,
          `user info is ${stringify(user)}`,
        );
        const newUser = new this.userModel(user);
        const savedUser = await newUser.save();
        return savedUser;
      } else {
        this.logger.debug(
          `user number is ${user.number} 本地判断无权限，调用银豹接口，更新用户信息如下`,
          `user info is ${stringify(user)}`,
        );
        oldUser.categoryName = user.categoryName;
        oldUser.phone = user.phone;
        oldUser.count = 50;
        oldUser.name = user.name;
        oldUser.birthday = user.birthday;
        oldUser.expiryDate = user.expiryDate;
        const savedUser = await oldUser.save();
        return savedUser;
      }
    } catch (error) {
      this.logger.error(
        `updateUser  error`,
        `error user is ${stringify(user)}`,
        `error is ${error}`,
      );
    }
  }
}
