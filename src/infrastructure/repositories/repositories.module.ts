import { Module } from '@nestjs/common';
import { MongoDBModule } from '../database/mongodb.module';
import { UserRepository } from './user.repository';
import { ApplicationRepository } from './application.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { USER_REPOSITORY_TOKEN } from 'src/domain/repositories/user.repository.interface';
import { APPLICATION_REPOSITORY_TOKEN } from 'src/domain/repositories/application.repository.interface';
import { REFRESH_TOKEN_REPOSITORY_TOKEN } from 'src/domain/repositories/refresh-token.repository.interface';

@Module({
  imports: [MongoDBModule],
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    {
      provide: APPLICATION_REPOSITORY_TOKEN,
      useClass: ApplicationRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY_TOKEN,
      useClass: RefreshTokenRepository,
    },
  ],
  exports: [
    USER_REPOSITORY_TOKEN,
    APPLICATION_REPOSITORY_TOKEN,
    REFRESH_TOKEN_REPOSITORY_TOKEN,
  ],
})
export class RepositoriesModule {}
