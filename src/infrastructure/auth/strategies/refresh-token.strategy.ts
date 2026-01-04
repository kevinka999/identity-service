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
    const publicKey = configService.get<string>('JWT_REFRESH_TOKEN_PUBLIC_KEY');
    if (!publicKey) {
      throw new Error('JWT_REFRESH_TOKEN_PUBLIC_KEY is required');
    }
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.refreshToken;
      },
      secretOrKey: publicKey.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
