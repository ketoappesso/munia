import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { TokenInfo } from './auth.interface';
import config from '../../../config';
const conf = config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: conf.JWT_SECRET,
    });
  }

  async validate(payload: TokenInfo) {
    return { uin: payload.uin };
  }
}
