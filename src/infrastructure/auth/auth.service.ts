import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IAuthService } from '../../domain/services/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private readonly ACCESS_TOKEN_PRIVATE_KEY: string;
  private readonly REFRESH_TOKEN_PRIVATE_KEY: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.ACCESS_TOKEN_PRIVATE_KEY =
      this.configService.get<string>('JWT_ACCESS_TOKEN_PRIVATE_KEY') || '';
    this.REFRESH_TOKEN_PRIVATE_KEY =
      this.configService.get<string>('JWT_REFRESH_TOKEN_PRIVATE_KEY') || '';

    if (!this.ACCESS_TOKEN_PRIVATE_KEY) {
      throw new Error('JWT_ACCESS_TOKEN_PRIVATE_KEY is required');
    }

    if (!this.REFRESH_TOKEN_PRIVATE_KEY) {
      throw new Error('JWT_REFRESH_TOKEN_PRIVATE_KEY is required');
    }
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
      privateKey: this.ACCESS_TOKEN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      algorithm: 'RS256',
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
      privateKey: this.REFRESH_TOKEN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      algorithm: 'RS256',
      expiresIn: '3d',
    });
  }
}
