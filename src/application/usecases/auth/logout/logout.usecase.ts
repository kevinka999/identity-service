import { Injectable, Inject } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY_TOKEN } from '../../../../domain/repositories/refresh-token.repository.interface';
import type { IRefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class LogoutUsecase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY_TOKEN)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, applicationId: string): Promise<void> {
    await this.refreshTokenRepository.deleteByUserAndApplication(
      userId,
      applicationId,
    );
  }
}
