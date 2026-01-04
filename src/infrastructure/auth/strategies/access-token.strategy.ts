import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email?: string;
  aud: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const publicKey = configService.get<string>('JWT_ACCESS_TOKEN_PUBLIC_KEY');
    if (!publicKey) {
      throw new Error('JWT_ACCESS_TOKEN_PUBLIC_KEY is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: publicKey.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    const clientId = req.headers['x-client-id'] as string;

    if (!clientId) {
      throw new UnauthorizedException('x-client-id header is required');
    }

    if (payload.aud !== clientId) {
      throw new UnauthorizedException(
        'Token audience does not match application',
      );
    }

    return payload;
  }
}
