import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedEnvelopeService } from '../red-envelope/red-envelope.service';
// import { UserService } from '../user/user.service';
import { PaspalService } from '../paspal/paspal.service';
import { formateDate } from 'src/utils';
import { ApiNames, IsValidateBalance } from '../paspal/paspal.interface';
import { RedEnvelopeStatus } from '../red-envelope/red-envelope.interface';

@Injectable()
export class TasksService {
  constructor(
    private readonly redEnvelopeService: RedEnvelopeService,
    private readonly paspalService: PaspalService,
  ) {}
  private readonly logger = new Logger(TasksService.name);
  // 五秒执行一次，每次只处理一个过期红包，银豹的接口并发有些小问题
  @Cron('0/5 * * * * *')
  async getExpiredRedEnvelopeList() {
    const info = await this.redEnvelopeService.getOneExpiredRedEnve();
    if (!info) return;
    const { redEnvelopeInfo, userInfo } = info;
    this.logger.debug(redEnvelopeInfo);
    this.logger.debug(userInfo);
    await this.paspalService.request(ApiNames.UpdateBalancePointByIncrement, {
      customerUid: BigInt(userInfo.customerUid),
      dataChangeTime: formateDate(new Date()), // 测试给自己转账，加一个时间，否则可能失败，正式发布去掉
      validateBalance: IsValidateBalance.TRUE,
      balanceIncrement: redEnvelopeInfo.price,
    });
    await this.redEnvelopeService.setRedEnvelopeStatus(
      redEnvelopeInfo,
      RedEnvelopeStatus.EXPIRED,
    );
  }
}
