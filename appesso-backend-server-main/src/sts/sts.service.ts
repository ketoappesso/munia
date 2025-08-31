import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as STS from 'qcloud-cos-sts';
import { TempKeys } from './sts.interface';

@Injectable()
export class StsService {
  constructor(private configService: ConfigService) {}
  private readonly logger = new Logger(StsService.name);
  async getTempKeys() {
    const tempKeys = await this.getCredential();
    return tempKeys;
  }

  getCredential(): Promise<TempKeys> {
    return new Promise((resolve, reject) => {
      const config = {
        appid: '1317460526',
        bucket: 'appesso',
        secretId: this.configService.get('COS_SECRET_ID'),
        secretKey: this.configService.get('COS_SECRET_KEY'),
        region: 'ap-guangzhou',
        proxy: '',
        durationSeconds: 1800,
        allowPrefix: '*',
        allowActions: [
          // 简单上传
          'name/cos:PutObject',
          'name/cos:PostObject',
          // 分片上传
          'name/cos:InitiateMultipartUpload',
          'name/cos:ListMultipartUploads',
          'name/cos:ListParts',
          'name/cos:UploadPart',
          'name/cos:CompleteMultipartUpload',
        ],
      };
      const policy = {
        version: '2.0',
        statement: [
          {
            action: config.allowActions,
            effect: 'allow',
            principal: { qcs: ['*'] },
            resource: [
              `qcs::cos:${config.region}:uid/${config.appid}:prefix//${config.appid}/${config.bucket}/${config.allowPrefix}`,
            ],
          },
        ],
      };
      STS.getCredential(
        {
          secretId: config.secretId,
          secretKey: config.secretKey,
          proxy: config.proxy,
          durationSeconds: config.durationSeconds,
          policy: policy,
        },
        (err, tempKeys) => {
          if (err) {
            reject(err);
          } else {
            resolve(tempKeys as TempKeys);
          }
        },
      );
    });
  }
}
