import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { RedEnvelope } from './red-envelope.schema';
import { UserService } from '../user/user.service';
// import { ApiNames, IsValidateBalance } from 'src/paspal-api/api';
// import { request } from 'src/paspal-api/request';
import { CustomerError, formateDate } from 'src/utils';
import { StatusCode } from 'src/types/responce';
import {
  CreateRedEnvelopeResp,
  CreateRedEnvelopeServiceInput,
  GetRedEnvelopeDetailResp,
  ReceiveRedEnvelopeReq,
  ReceiveRedEnvelopeResp,
  RedEnvelopeStatus,
} from './red-envelope.interface';
import { ChatService } from 'src/server/chat/chat.service';
import { MessageService } from 'src/server/message/message.service';
import { MessageType } from 'src/server/message/message.interface';
import { PaspalService } from '../paspal/paspal.service';
import { ApiNames, IsValidateBalance } from '../paspal/paspal.interface';

@Injectable()
export class RedEnvelopeService {
  constructor(
    @InjectModel('RedEnvelope')
    private readonly redEnvelopeModel: Model<RedEnvelope>,
    private readonly usersService: UserService,
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    private readonly paspalService: PaspalService,
  ) {}
  private readonly logger = new Logger(RedEnvelopeService.name);
  async createRedEnvelope(
    payload: CreateRedEnvelopeServiceInput,
  ): Promise<CreateRedEnvelopeResp> {
    try {
      const { from, to, price, chatId, remark } = payload;
      const fromUserInfo = await this.usersService.findUserInfoWithUin(from);
      const fromCustomerUid = fromUserInfo.customerUid;
      const deducteResult = await this.paspalService.request(
        ApiNames.UpdateBalancePointByIncrement,
        {
          customerUid: BigInt(fromCustomerUid),
          dataChangeTime: formateDate(new Date()),
          validateBalance: IsValidateBalance.TRUE,
          balanceIncrement: -price,
        },
      );
      if (!deducteResult) {
        throw new CustomerError('扣减余额失败', StatusCode.OTHER);
      }
      const expiredData = Number(new Date()) + 43200000; // 48小时之后过期
      if (chatId && to) {
        const toUserInfo = await this.usersService.findUserInfoWithUin(to);
        const toCustomerUid = toUserInfo.customerUid;
        const newRedEnvelope = new this.redEnvelopeModel({
          from,
          to: to || '',
          price,
          chatId: chatId || '',
          expiredData,
          status: RedEnvelopeStatus.RECEIVED,
          remark: remark || '',
        });
        const chatInfo = await this.chatService.findChatById(chatId);
        // 发送红包需要修改未读消息。
        if (from === chatInfo.userA) {
          chatInfo.userBUnreadMessageCount =
            chatInfo.userBUnreadMessageCount + 1;
        } else {
          chatInfo.userAUnreadMessageCount =
            chatInfo.userAUnreadMessageCount + 1;
        }
        chatInfo.updateTime = Number(new Date());
        const res = await this.paspalService.request(
          ApiNames.UpdateBalancePointByIncrement,
          {
            customerUid: BigInt(toCustomerUid),
            dataChangeTime: formateDate(Number(new Date())), // 测试给自己转账，加一个时间，否则可能失败，正式发布去掉
            validateBalance: IsValidateBalance.TRUE,
            balanceIncrement: price,
          },
        );
        if (!res) {
          throw new CustomerError('为对方增加余额失败', StatusCode.OTHER);
        }
        const result = await newRedEnvelope.save();
        const id = result._id.toString();
        await Promise.all([
          this.messageService.createMessage(
            from,
            to,
            id,
            MessageType.RedEnvelope,
            chatId,
          ),
          chatInfo.save(),
        ]);
        return {
          result: true,
          redEnvelopeId: id,
        };
      } else {
        const newRedEnvelope = new this.redEnvelopeModel({
          from,
          to: to || '',
          price,
          chatId: chatId || '',
          expiredData,
          status: RedEnvelopeStatus.NOT_RECEIVED,
          remark: remark || '',
        });
        const result = await newRedEnvelope.save();
        const id = result._id.toString();
        return {
          result: true,
          redEnvelopeId: id,
        };
      }
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---createRedEnvelope_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async getRedEnvelopeInfo(id: string): Promise<GetRedEnvelopeDetailResp> {
    try {
      const redEnvelope = await this.redEnvelopeModel.findById(id);
      const [fromUserInfo, toUserInfo] = await Promise.all([
        this.usersService.findUserInfoWithUin(redEnvelope.from),
        this.usersService.findUserInfoWithUin(redEnvelope.to),
      ]);
      return {
        redEnvelopeId: redEnvelope._id.toString(),
        fromUin: redEnvelope.from,
        fromName: fromUserInfo.name,
        fromPhotoPath: fromUserInfo.photoPath,
        toUin: redEnvelope?.to,
        toName: toUserInfo?.name || '',
        toPhotoPath: toUserInfo?.photoPath || '',
        price: redEnvelope.price,
        chatId: redEnvelope.chatId,
        status: redEnvelope.status,
        expiredData: redEnvelope.expiredData,
        remark: redEnvelope.remark,
      };
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---getRedEnvelopeInfo_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async findRedEnvelopeById(id: string): Promise<RedEnvelope> {
    try {
      const redEnvelope = await this.redEnvelopeModel.findById(id);
      return redEnvelope;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findRedEnvelopeById_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async receiveRedEnvelope(
    payload: ReceiveRedEnvelopeReq,
    uin: string,
  ): Promise<ReceiveRedEnvelopeResp> {
    try {
      const { redEnvelopeId } = payload;
      const redEnvelopeInfo = await this.findRedEnvelopeById(redEnvelopeId);
      if (!redEnvelopeInfo) {
        throw new CustomerError('红包已过期，领取失败', StatusCode.HAS_EXPIRED);
      }
      if (Number(new Date()) > redEnvelopeInfo.expiredData) {
        throw new CustomerError('红包已过期，领取失败', StatusCode.HAS_EXPIRED);
      }
      if (redEnvelopeInfo.status !== RedEnvelopeStatus.NOT_RECEIVED) {
        throw new CustomerError('红包已过期，领取失败', StatusCode.HAS_EXPIRED);
      }
      if (redEnvelopeInfo.from === uin) {
        throw new CustomerError(
          '无法领取自己发送的红包',
          StatusCode.HAS_EXPIRED,
        );
      }
      const userInfo = await this.usersService.findUserInfoWithUin(uin);
      const customerUid = userInfo.customerUid;
      const nowDate = formateDate(new Date());
      await this.paspalService.request(ApiNames.UpdateBalancePointByIncrement, {
        customerUid: BigInt(customerUid),
        dataChangeTime: nowDate,
        validateBalance: IsValidateBalance.TRUE,
        balanceIncrement: redEnvelopeInfo.price,
      });
      redEnvelopeInfo.status = RedEnvelopeStatus.RECEIVED;
      redEnvelopeInfo.to = uin;
      await redEnvelopeInfo.save();
      const chatInfo = await this.chatService.findOrCreateChat(
        redEnvelopeInfo.from,
        redEnvelopeInfo.to,
      );
      await this.messageService.createMessage(
        redEnvelopeInfo.from,
        redEnvelopeInfo.to,
        redEnvelopeInfo._id.toString(),
        MessageType.RedEnvelope,
        chatInfo._id.toString(),
      );
      return {
        result: true,
        chatId: chatInfo._id.toString(),
      };
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---receiveRedEnvelope_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async findRedEnvelopeByIds(ids: string[]): Promise<RedEnvelope[]> {
    try {
      const redEnvelopes = this.redEnvelopeModel.find({ _id: { $in: ids } });
      return redEnvelopes;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findRedEnvelopeByIds_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async getOneExpiredRedEnve() {
    try {
      const nowDate = new Date();
      // 查找条件： 未领取，但过期时间小于当前时间（时间已过期）
      const filter = {
        expiredData: {
          $lte: nowDate,
        },
        status: RedEnvelopeStatus.NOT_RECEIVED,
      };
      // const total = await this.redEnvelopeModel.countDocuments(filter);
      const redEnvelopeInfo = await this.redEnvelopeModel.findOne(filter);
      if (!redEnvelopeInfo) {
        return null;
      } else {
        const userInfo = await this.usersService.findUserInfoWithUin(
          redEnvelopeInfo.from,
        );
        return {
          redEnvelopeInfo,
          userInfo,
        };
      }
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---getOneExpiredRedEnve_error---', e);
        throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
      }
    }
  }
  async setRedEnvelopeStatus(
    redEnvelopeInfo: Document<unknown, object, RedEnvelope> &
      Omit<RedEnvelope, never>,
    status: RedEnvelopeStatus,
  ) {
    redEnvelopeInfo.status = status;
    await redEnvelopeInfo.save();
  }
}
