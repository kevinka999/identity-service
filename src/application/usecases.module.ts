import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { CryptoModule } from '../infrastructure/crypto/crypto.module';

import usecases from './usecases';
import controllers from './controllers';

@Module({
  imports: [RepositoriesModule, AuthModule, CryptoModule],
  controllers: controllers,
  providers: usecases,
})
export class UseCasesModule {}
