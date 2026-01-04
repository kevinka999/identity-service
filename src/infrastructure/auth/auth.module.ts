import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { AUTH_SERVICE_TOKEN } from '../../domain/services/auth.service.interface';
import { GOOGLE_SERVICE_TOKEN } from '../../domain/services/google.service.interface';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [
    {
      provide: AUTH_SERVICE_TOKEN,
      useClass: AuthService,
    },
    {
      provide: GOOGLE_SERVICE_TOKEN,
      useClass: GoogleService,
    },
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AUTH_SERVICE_TOKEN, GOOGLE_SERVICE_TOKEN],
})
export class AuthModule {}
