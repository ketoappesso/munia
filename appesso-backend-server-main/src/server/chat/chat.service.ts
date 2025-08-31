import { Injectable, Logger } from '@nestjs/common';
import { Chat } from './chat.schame';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StatusCode } from 'src/types/responce';
import { CustomerError } from 'src/utils';
import {
  ChatResp,
  GetChatDetailsResp,
  GetChatListResp,
} from './chat.interface';
import { UserService } from '../user/user.service';
import { MessageService } from '../message/message.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('chat')
    private readonly chatModel: Model<Chat>,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
  ) {}
  private readonly logger = new Logger(ChatService.name);
  async createChat(userA: string, userB: string): Promise<Chat> {
    try {
      const newChat = new this.chatModel({
        userA,
        userB,
        createTime: Number(new Date()),
        updateTime: Number(new Date()),
        userAUnreadMessageCount: 0,
        userBUnreadMessageCount: 0,
      });
      const result = await newChat.save();
      return result;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---createChat_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }
  // 基于
  async findOrCreateChat(from: string, to: string): Promise<Chat> {
    try {
      let chatInfo = await this.findChatByUserInfo(from, to);
      if (!chatInfo) {
        chatInfo = await this.createChat(from, to);
      } else {
        if (chatInfo.userA === from) {
          chatInfo.userBUnreadMessageCount =
            chatInfo.userBUnreadMessageCount + 1;
        } else {
          chatInfo.userAUnreadMessageCount =
            chatInfo.userAUnreadMessageCount + 1;
        }
        chatInfo.updateTime = Number(new Date());
        await chatInfo.save();
      }
      return chatInfo;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findOrCreateChat_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }
  async findChatById(id: string): Promise<Chat> {
    try {
      const res = this.chatModel.findById(id);
      return res;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findChatById_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }
  async findChatByUserInfo(userA: string, userB: string): Promise<Chat> {
    try {
      const filter1 = { userA, userB };
      const filter2 = { userA: userB, userB: userA };
      const filter = {
        $or: [filter1, filter2],
      };
      const chatInfo = await this.chatModel.findOne(filter);
      if (chatInfo) {
        return chatInfo;
      }
      const newChatInfo = await this.createChat(userA, userB);
      return newChatInfo;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findChatByUserInfo_error---', e);
        throw new CustomerError('信息保存失败，请联系后台', StatusCode.OTHER);
      }
    }
  }
  async findChatListForUser(
    uin: string,
    offset: number,
    count: number,
  ): Promise<GetChatListResp> {
    try {
      const filter1 = { userA: uin };
      const filter2 = { userB: uin };
      const filter = {
        $or: [filter1, filter2],
      };
      const originChatList = await this.chatModel
        .find(filter)
        .sort({ updateTime: -1 })
        .skip(offset)
        .limit(count)
        .exec();
      const otherUin = originChatList.map((chat) => {
        if (chat.userA === uin) {
          return chat.userB;
        } else {
          return chat.userA;
        }
      });
      const chatIdList = originChatList.map((chat) => chat._id.toString());
      const [selfUser, otherUsers, lastMessageList] = await Promise.all([
        this.userService.getUserInfoByUin(uin),
        this.userService.getUserInfosByUins(otherUin),
        this.messageService.getLastMessagesListByChatId(chatIdList),
      ]);
      const total = await this.chatModel.countDocuments(filter);
      const chatList: ChatResp[] = originChatList.map((chat) => {
        const otherUin = chat.userA === uin ? chat.userB : chat.userA;
        const otherUser = otherUsers.find((user) => {
          return user.uin === otherUin;
        });
        const lastMessage = lastMessageList.find((msg) => {
          return chat._id.toString() === msg.chatId;
        });
        return {
          chatId: chat._id.toString(),
          selfInfo: {
            uin,
            photoPath: selfUser.photoPath,
            name: selfUser.name,
          },
          otherInfo: {
            uin: otherUser.uin,
            photoPath: otherUser.photoPath,
            name: otherUser.name,
          },
          selfUnreadMessageCount:
            uin === chat.userA
              ? chat.userAUnreadMessageCount
              : chat.userBUnreadMessageCount,
          otherUnreadMessageCount:
            uin === chat.userA
              ? chat.userBUnreadMessageCount
              : chat.userAUnreadMessageCount,
          lastMessage: lastMessage,
        };
      });
      return {
        chatList,
        total,
      };
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findChatListForUser_error---', e);
        throw new CustomerError('发生未知错误，请联系后台', StatusCode.OTHER);
      }
    }
  }
  async findChatDetailForUser(
    id: string,
    uin: string,
    offset: number,
    count: number,
  ): Promise<GetChatDetailsResp> {
    try {
      const { total, messages } = await this.messageService.getMessagesByChatId(
        id,
        offset,
        count,
      );
      const originChatInfo = await this.chatModel.findById(id);
      if (!originChatInfo) {
        throw new CustomerError('聊天记录不存在', StatusCode.OTHER);
      }
      if (uin === originChatInfo.userA) {
        originChatInfo.userAUnreadMessageCount = 0;
      } else {
        originChatInfo.userBUnreadMessageCount = 0;
      }
      const [userAInfo, userBInfo] = await Promise.all([
        this.userService.findUserInfoWithUin(originChatInfo.userA),
        this.userService.findUserInfoWithUin(originChatInfo.userB),
        originChatInfo.save(),
      ]);
      const chat = {
        chatId: originChatInfo._id.toString(),
        userAUin: originChatInfo.userA,
        userBUin: originChatInfo.userB,
        userAName: userAInfo.name,
        userBName: userBInfo.name,
        userAPhotoPath: userAInfo.photoPath,
        userBPhotoPath: userBInfo.photoPath,
      };
      const res: GetChatDetailsResp = {
        messages: {
          messageList: messages,
          total,
        },
        ...chat,
      };
      return res;
    } catch (e) {
      if (e instanceof CustomerError) {
        throw e;
      } else {
        this.logger.error('---findChatDetailForUser_error---', e);
        throw new CustomerError('未知错误，请联系后台', StatusCode.OTHER);
      }
    }
  }
}
