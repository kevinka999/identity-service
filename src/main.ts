import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import cookieParser from 'cookie-parser';

async function setupSwagger(app: INestApplication) {
  if (process.env.NODE_ENV !== 'development') return;

  const config = new DocumentBuilder()
    .setTitle('Identity Service API')
    .setDescription('API for authentication and identity management')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-client-id',
        in: 'header',
        description:
          'Application Client ID (required for authentication endpoints)',
      },
      'x-client-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-client-secret',
        in: 'header',
        description:
          'Application Client Secret (required for authentication endpoints)',
      },
      'x-client-secret',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-admin-pass-key',
        in: 'header',
        description: 'Admin pass key for administrative endpoints',
      },
      'x-admin-pass-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupSwagger(app);

  app.use(cookieParser());
  app.useGlobalPipes(new ZodValidationPipe());
  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
