import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { generateResponce, CustomerError } from 'src/utils';
import { StsService } from './sts.service';
import { TempKeys } from './sts.interface';

@Controller('sts')
export class StsController {
  constructor(private readonly stsService: StsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('getTempKeys')
  async getTempKeys() {
    try {
      const res = await this.stsService.getTempKeys();
      return generateResponce<TempKeys>(res);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
}
