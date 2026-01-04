import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { LogoutUsecase } from './logout.usecase';
import { JwtGuard } from '../../../../infrastructure/guards/jwt.guard';
import { ApplicationGuard } from '../../../../infrastructure/guards/application.guard';
import { User } from '../../../../infrastructure/guards/jwt.decorator';
import { ApplicationFromRequest } from '../../../../infrastructure/guards/application.decorator';
import type { JwtPayload } from '../../../../infrastructure/auth/strategies/access-token.strategy';
import { Application } from '../../../../domain/entities/application.entity';

@Controller('auth')
export class LogoutController {
  constructor(private readonly logoutUsecase: LogoutUsecase) {}

  @Post('logout')
  @UseGuards(JwtGuard, ApplicationGuard)
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  async logout(
    @User() user: JwtPayload,
    @ApplicationFromRequest() application: Application,
  ) {
    await this.logoutUsecase.execute(user.sub, application._id);

    return {
      message: 'Logout realizado com sucesso',
    };
  }
}
