import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function setupSwagger(app: INestApplication) {
  if (process.env.NODE_ENV !== 'development') return;

  const config = new DocumentBuilder()
    .setTitle('Identity Service API')
    .setDescription('API para gerenciamento de autenticação e identidade')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupSwagger(app);

  // app.use(cookieParser());
  // app.useGlobalPipes(new ZodValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
