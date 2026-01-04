import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UseCasesModule } from './application/usecases.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UseCasesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
