import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Message } from './message.schame';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GetMessagesListResp,
  MessageResp,
  MessageType,
} from './message.interface';
import { StatusCode } from 'src/types/responce';
import { CustomerError } from 'src/utils';
import { RedEnvelopeService } from '../red-envelope/red-envelope.service';
import { RedEnvelope } from '../red-envelope/red-envelope.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('message')
    private readonly messageModel: Model<Message>,
    @Inject(forwardRef(() => RedEnvelopeService))
    private readonly redEnvelopeService: RedEnvelopeService,
  ) {}
  private readonly logger = new Logger(MessageService.name);
  async createMessage(
    from: string,
    to: string,
    releationId: string,
    messageType: MessageType,
    chatId: string,
  ): Promise<Message> {
    try {
      const newMessage = new this.messageModel({
        from,
        to,
        releationId,
        messageType,
        createTime: Number(new Date()),
        chatId,
      });
      const result = await newMessage.save();
      return result;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---createMessage_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }
  async getMessagesByChatId(
    chatId: string,
    offset: number,
    count: number,
  ): Promise<GetMessagesListResp> {
    try {
      const filter = { chatId };
      const total = await this.messageModel.countDocuments(filter);
      const originMessages = (
        await this.messageModel
          .find(filter)
          .sort({ createTime: -1 })
          .skip(offset)
          .limit(count)
          .exec()
      ).sort((a, b) => a.createTime - b.createTime);
      const redEnvelopeIds: string[] = [];
      originMessages.forEach((message) => {
        if (message.messageType === MessageType.RedEnvelope) {
          redEnvelopeIds.push(message.releationId);
        }
      });
      // 消息和红包都按照创建时间排序，这样后面可以直接按照index来对应。
      const redEnvelopeInfos = (
        await this.redEnvelopeService.findRedEnvelopeByIds(redEnvelopeIds)
      ).sort((a, b) => a.expiredData - b.expiredData);
      const messages: MessageResp<RedEnvelope>[] = originMessages.map(
        (msg, index) => {
          const redEnvelopeInfo = redEnvelopeInfos.find((item) => {
            return msg.releationId === item._id.toString();
          });
          return {
            from: msg.from,
            to: msg.to,
            createTime: msg.createTime,
            messageType: msg.messageType,
            messageInfo: redEnvelopeInfo,
            messageId: msg._id.toString(),
            chatId: msg.chatId,
          };
        },
      );
      return { total, messages };
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---getMessagesByChatId_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }

  async getLastMessagesByChatId(
    chatId: string,
  ): Promise<MessageResp<RedEnvelope>> {
    try {
      const filter = { chatId };
      const messageList = await this.messageModel
        .find(filter)
        .sort({ createTime: -1 })
        .skip(0)
        .limit(1)
        .exec();
      const originMessage = messageList[0];
      const redEnvelopeId: string = originMessage?.releationId;
      const redEnvelopeInfo = await this.redEnvelopeService.findRedEnvelopeById(
        redEnvelopeId,
      );
      const message = {
        chatId: originMessage.chatId,
        from: originMessage.from,
        to: originMessage.to,
        createTime: originMessage.createTime,
        messageType: originMessage.messageType,
        messageInfo: redEnvelopeInfo,
        messageId: originMessage._id.toString(),
      };
      return message;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---getLastMessagesByChatId_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }
  async getLastMessagesListByChatId(
    chatIds: string[],
  ): Promise<MessageResp<RedEnvelope>[]> {
    const lastMessageList = await Promise.all(
      chatIds.map((id) => {
        return this.getLastMessagesByChatId(id);
      }),
    );
    return lastMessageList;
  }
}
