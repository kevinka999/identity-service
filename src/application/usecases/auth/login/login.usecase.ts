import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { AUTH_SERVICE_TOKEN } from '../../../../domain/services/auth.service.interface';
import type { IAuthService } from '../../../../domain/services/auth.service.interface';
import { GOOGLE_SERVICE_TOKEN } from '../../../../domain/services/google.service.interface';
import type { IGoogleService } from '../../../../domain/services/google.service.interface';
import { REFRESH_TOKEN_REPOSITORY_TOKEN } from '../../../../domain/repositories/refresh-token.repository.interface';
import type { IRefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.interface';
import { CRYPTO_SERVICE_TOKEN } from '../../../../domain/services/crypto.service.interface';
import type { ICryptoService } from '../../../../domain/services/crypto.service.interface';
import { LoginDto, LoginGoogleDto } from './login.dto';
import { Application } from '../../../../domain/entities/application.entity';
import { UserApplication } from '../../../../domain/entities/user.entity';
import {
  RefreshToken,
  RefreshTokenPayload,
} from '../../../../domain/entities/refresh-token.entity';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUsecase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly authService: IAuthService,
    @Inject(GOOGLE_SERVICE_TOKEN)
    private readonly googleService: IGoogleService,
    @Inject(REFRESH_TOKEN_REPOSITORY_TOKEN)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(CRYPTO_SERVICE_TOKEN)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(
    dto: LoginDto,
    application: Application,
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const localProvider = user.authProviders.find(
      (p) => p.provider === 'local',
    );

    if (!localProvider || !localProvider.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.cryptoService.comparePassword(
      dto.password,
      localProvider.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userApplication = user.applications.find(
      (app) => app.applicationId === application._id,
    );

    if (!userApplication) {
      throw new UnauthorizedException(
        'User is not associated with this application',
      );
    }

    if (userApplication.status !== 'active') {
      throw new UnauthorizedException('User is blocked in this application');
    }

    return this.generateTokensAndCreateRefreshToken(
      user._id,
      user.email,
      application._id,
      application.clientId,
    );
  }

  async executeGoogle(
    dto: LoginGoogleDto,
    application: Application,
  ): Promise<LoginResponse> {
    const googleData = await this.googleService.validateCredential(
      dto.credential,
    );

    if (!googleData.email) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    let user = await this.userRepository.findByEmail(googleData.email);

    if (!user) {
      user = await this.userRepository.create({
        email: googleData.email.toLowerCase(),
        emailVerified: true,
        authProviders: [
          {
            provider: 'google',
            providerUserId: googleData.email,
            createdAt: new Date(),
          },
        ],
        applications: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      const hasGoogleProvider = user.authProviders.some(
        (p) => p.provider === 'google',
      );

      if (!hasGoogleProvider) {
        user.authProviders.push({
          provider: 'google',
          providerUserId: googleData.email,
          createdAt: new Date(),
        });
        await this.userRepository.update(user._id, {
          authProviders: user.authProviders,
        });
      }
    }

    let userApplication = user.applications.find(
      (app) => app.applicationId === application._id,
    );

    if (!userApplication) {
      const newUserApplication: UserApplication = {
        applicationId: application._id,
        role: 'user',
        status: 'active',
        createdAt: new Date(),
      };

      user = await this.userRepository.addApplication(
        user._id,
        newUserApplication,
      );
      userApplication = newUserApplication;
    } else if (userApplication.status !== 'active') {
      throw new UnauthorizedException('User is blocked in this application');
    }

    return this.generateTokensAndCreateRefreshToken(
      user._id,
      user.email,
      application._id,
      application.clientId,
    );
  }

  private async generateTokensAndCreateRefreshToken(
    userId: string,
    userEmail: string,
    applicationId: string,
    clientId: string,
  ): Promise<LoginResponse> {
    const accessToken = await this.authService.generateAccessToken(
      userId,
      userEmail,
      clientId,
    );

    const refreshToken = await this.authService.generateRefreshToken(
      userId,
      clientId,
    );

    await this.createRefreshToken(userId, applicationId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async createRefreshToken(
    userId: string,
    applicationId: string,
    token: string,
  ): Promise<RefreshToken> {
    const tokenHash = await this.cryptoService.hash(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day

    await this.refreshTokenRepository.deleteByUserAndApplication(
      userId,
      applicationId,
    );

    const payload: RefreshTokenPayload = {
      userId,
      applicationId,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.refreshTokenRepository.create(payload);
  }
}
