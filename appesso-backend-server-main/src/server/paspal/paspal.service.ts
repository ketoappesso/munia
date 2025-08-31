import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request } from './paspal.request';
import { AppConfigWithoutKey, AppConfigs } from './appInfo';
import { ApiNames, ApiReq, ApiResp } from './paspal.interface';
import { TasksService } from '../task/task.service';

@Injectable()
export class PaspalService {
  constructor(private configService: ConfigService) {}
  private readonly logger = new Logger(PaspalService.name);
  async request<T extends ApiNames>(
    apiName: T,
    payload: ApiReq<T>,
    appConfig: AppConfigWithoutKey = AppConfigs.ZD,
  ): Promise<ApiResp<T>> {
    const appKey = this.configService.get(`PASPAL_${appConfig.ID}`);
    this.logger.debug('appConfig.name:', appConfig.name);
    this.logger.debug('appKey:', appKey);
    return request<T>(apiName, payload, {
      ...appConfig,
      appKey,
    });
  }
}
