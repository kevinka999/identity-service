import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RefreshUsecase } from './refresh.usecase';
import { JwtRefreshGuard } from '../../../../infrastructure/guards/jwt-refresh.guard';
import { User } from '../../../../infrastructure/guards/jwt.decorator';
import type { JwtPayload } from '../../../../infrastructure/auth/strategies/access-token.strategy';

@Controller('auth')
export class RefreshController {
  constructor(private readonly refreshUsecase: RefreshUsecase) {}

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(@User() user: JwtPayload, @Req() request: Request) {
    const refreshToken = request.cookies?.refreshToken as string;

    if (!refreshToken) {
      throw new Error('Refresh token not found in cookies');
    }

    const accessToken = await this.refreshUsecase.execute(user, refreshToken);

    return {
      accessToken,
    };
  }
}
