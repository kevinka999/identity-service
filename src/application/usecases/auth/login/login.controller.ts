import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiSecurity } from '@nestjs/swagger';
import { LoginUsecase } from './login.usecase';
import { LoginDto, LoginGoogleDto } from './login.dto';
import { ApplicationGuard } from '../../../../infrastructure/guards/application.guard';
import { ApplicationFromRequest } from '../../../../infrastructure/guards/application.decorator';
import { Application } from '../../../../domain/entities/application.entity';

@Controller('auth')
export class LoginController {
  private readonly MAX_AGE: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly loginUsecase: LoginUsecase) {}

  @Post('login')
  @UseGuards(ApplicationGuard)
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  async login(
    @Body() dto: LoginDto,
    @ApplicationFromRequest() application: Application,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginUsecase.execute(dto, application);

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.MAX_AGE,
    });

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('login/google')
  @UseGuards(ApplicationGuard)
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  async loginGoogle(
    @Body() dto: LoginGoogleDto,
    @ApplicationFromRequest() application: Application,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginUsecase.executeGoogle(dto, application);

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.MAX_AGE,
    });

    return {
      accessToken: result.accessToken,
    };
  }
}
