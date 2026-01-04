import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CRYPTO_SERVICE_TOKEN } from '../../domain/services/crypto.service.interface';

@Module({
  providers: [
    {
      provide: CRYPTO_SERVICE_TOKEN,
      useClass: CryptoService,
    },
  ],
  exports: [CRYPTO_SERVICE_TOKEN],
})
export class CryptoModule {}

