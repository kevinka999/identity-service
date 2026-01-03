import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchemaFactory } from './schemas/user.schema';
import { ApplicationSchemaFactory } from './schemas/application.schema';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
        dbName: 'identity-service',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchemaFactory },
      { name: 'Application', schema: ApplicationSchemaFactory },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoDBModule {}
