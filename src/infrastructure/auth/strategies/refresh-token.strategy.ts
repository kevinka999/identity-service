import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './access-token.strategy';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET is required');
    }
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.refreshToken;
      },
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
