import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { SignupUsecase } from './signup.usecase';
import { SignupDto } from './signup.dto';
import { ApplicationGuard } from '../../../../infrastructure/guards/application.guard';
import { ApplicationFromRequest } from '../../../../infrastructure/guards/application.decorator';
import { Application } from '../../../../domain/entities/application.entity';

@Controller('auth')
export class SignupController {
  constructor(private readonly signupUsecase: SignupUsecase) {}

  @Post('signup')
  @UseGuards(ApplicationGuard)
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  async signup(
    @Body() dto: SignupDto,
    @ApplicationFromRequest() application: Application,
  ) {
    const user = await this.signupUsecase.execute(dto, application);

    return {
      id: user._id,
      email: user.email,
      emailVerified: user.emailVerified,
      applications: user.applications,
      createdAt: user.createdAt,
    };
  }
}
