import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IAuthService } from '../../domain/services/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.ACCESS_TOKEN_SECRET =
      this.configService.get<string>('ACCESS_TOKEN_SECRET') || '';
    this.REFRESH_TOKEN_SECRET =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') || '';
  }

  async generateAccessToken(
    userId: string,
    email: string,
    applicationId: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      aud: applicationId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.ACCESS_TOKEN_SECRET,
      expiresIn: '30m',
    });
  }

  async generateRefreshToken(
    userId: string,
    applicationId: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      aud: applicationId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.REFRESH_TOKEN_SECRET,
      expiresIn: '3d',
    });
  }

  async verifyToken(token: string, secret: string): Promise<unknown> {
    return this.jwtService.verifyAsync(token, { secret });
  }
}
