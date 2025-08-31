import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServerModule } from './server/server.module';
import { StsController } from './sts/sts.controller';
import configuration from '../config';
import { StsService } from './sts/sts.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://mongouser:aa1234567890@10.0.0.11:27017,10.0.0.10:27017/test?replicaSet=cmgo-afg4s771_0&authSource=admin',
      {
        dbName: 'main',
      },
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServerModule,
  ],
  controllers: [AppController, StsController],
  providers: [AppService, StsService],
})
export class AppModule {}
