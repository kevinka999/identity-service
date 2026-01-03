import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserPayload } from '../../domain/entities/user.entity';
import { UserRepository as IUserRepository } from '../../domain/repositories/user.repository.interface';
import { BaseRepositoryImpl } from './base.repository.impl';
import { UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class UserRepository
  extends BaseRepositoryImpl<User, UserPayload, UserDocument>
  implements IUserRepository
{
  constructor(
    @InjectModel('User') protected readonly model: Model<UserDocument>,
  ) {
    super(model);
  }

  protected toEntity(document: UserDocument): User {
    return new User({
      _id: document._id.toString(),
      email: document.email,
      emailVerified: document.emailVerified,
      authProviders: document.authProviders,
      applications: document.applications,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}

