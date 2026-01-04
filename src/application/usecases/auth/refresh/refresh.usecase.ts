import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { AUTH_SERVICE_TOKEN } from '../../../../domain/services/auth.service.interface';
import { APPLICATION_REPOSITORY_TOKEN } from '../../../../domain/repositories/application.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../../domain/repositories/user.repository.interface';
import { REFRESH_TOKEN_REPOSITORY_TOKEN } from '../../../../domain/repositories/refresh-token.repository.interface';
import { CRYPTO_SERVICE_TOKEN } from '../../../../domain/services/crypto.service.interface';
import type { IAuthService } from '../../../../domain/services/auth.service.interface';
import type { IApplicationRepository } from '../../../../domain/repositories/application.repository.interface';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import type { IRefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.interface';
import type { ICryptoService } from '../../../../domain/services/crypto.service.interface';
import type { JwtPayload } from '../../../../infrastructure/auth/strategies/access-token.strategy';

@Injectable()
export class RefreshUsecase {
  constructor(
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly authService: IAuthService,
    @Inject(APPLICATION_REPOSITORY_TOKEN)
    private readonly applicationRepository: IApplicationRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY_TOKEN)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(CRYPTO_SERVICE_TOKEN)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(user: JwtPayload, refreshToken: string): Promise<string> {
    const application = await this.applicationRepository.findByClientId(
      user.aud,
    );

    if (!application || !application.isActive) {
      throw new ForbiddenException('Application is not active');
    }

    const storedRefreshToken =
      await this.refreshTokenRepository.findByUserAndApplication(
        user.sub,
        application._id,
      );

    if (!storedRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedRefreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isTokenValid = await this.cryptoService.compare(
      refreshToken,
      storedRefreshToken.tokenHash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userEntity = await this.userRepository.findById(user.sub);

    if (!userEntity) {
      throw new UnauthorizedException('User not found');
    }

    const userApplication = userEntity.applications.find(
      (app) => app.applicationId === application._id,
    );

    if (!userApplication || userApplication.status !== 'active') {
      throw new ForbiddenException('User is not active in this application');
    }

    const accessToken = await this.authService.generateAccessToken(
      user.sub,
      userEntity.email,
      application.clientId,
    );

    return accessToken;
  }
}
