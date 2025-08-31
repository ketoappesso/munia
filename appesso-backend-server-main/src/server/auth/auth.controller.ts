import { Body, Controller, Post, Logger } from '@nestjs/common';
import { LoginWithCodeReq, LoginWithCodeResp } from './auth.interface';
import { AuthService } from './auth.service';
import { CustomerError, generateResponce } from 'src/utils';
import { ResponceType } from 'src/types/responce';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private readonly logger = new Logger(AuthController.name);
  @Post('loginWithCode')
  async loginWithCode(
    @Body() body: LoginWithCodeReq,
  ): Promise<ResponceType<LoginWithCodeResp | null>> {
    try {
      const resp = await this.authService.loginWithCode(body.code);
      this.logger.debug('----auth----', resp);
      return generateResponce<LoginWithCodeResp>(resp);
    } catch (e) {
      const err = e as CustomerError;
      return generateResponce<null>(null, err.message, err.code);
    }
  }
}
