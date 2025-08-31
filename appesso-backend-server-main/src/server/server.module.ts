import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedEnvelopeSchema } from './red-envelope/red-envelope.schema';
import { UserService } from './user/user.service';
import { ChatSchema } from 'src/server/chat/chat.schame';
import { MessageSchema } from 'src/server/message/message.schame';
import { UserSchema } from './user/user.schema';
import { UserController } from './user/user.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { RedEnvelopeController } from './red-envelope/red-envelope.controller';
import { RedEnvelopeService } from './red-envelope/red-envelope.service';
import { MessageController } from './message/message.controller';
import { MessageService } from './message/message.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AccessControlService } from './user/access-control.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { PaspalService } from './paspal/paspal.service';
import { WxSdkService } from './wxsdk/wxsdk.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './task/task.service';
import config from '../../config';
import { SmsCodeSchema } from './user/sms.schema';
import { TimelineTweetSchema } from './timeline/timeline.schema';
import { TimeLineService } from './timeline/timeline.service';
import { TimeLineController } from './timeline/timeline.controller';
const conf = config();

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RedEnvelope', schema: RedEnvelopeSchema },
      { name: 'User', schema: UserSchema },
      { name: 'chat', schema: ChatSchema },
      { name: 'message', schema: MessageSchema },
      { name: 'SmsCode', schema: SmsCodeSchema },
      { name: 'TimelineTweet', schema: TimelineTweetSchema },
    ]),
    ScheduleModule.forRoot(),
    PassportModule,
    JwtModule.register({
      secret: conf.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    UserController,
    AuthController,
    RedEnvelopeController,
    MessageController,
    ChatController,
    TimeLineController,
  ],
  providers: [
    UserService,
    AuthService,
    RedEnvelopeService,
    MessageService,
    ChatService,
    JwtService,
    JwtStrategy,
    AccessControlService,
    PaspalService,
    WxSdkService,
    TasksService,
    TimeLineService,
  ],
  exports: [
    UserService,
    AuthService,
    RedEnvelopeService,
    MessageService,
    ChatService,
  ],
})
export class ServerModule {}
