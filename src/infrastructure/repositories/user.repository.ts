import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserPayload,
  AuthProviderType,
  UserApplication,
} from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
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

  async findByEmail(email: string): Promise<User | null> {
    const document = await this.model
      .findOne({ email: email.toLowerCase() })
      .exec();
    if (!document) {
      return null;
    }
    return this.toEntity(document);
  }

  async findByEmailAndApplication(
    email: string,
    applicationId: string,
  ): Promise<User | null> {
    const document = await this.model
      .findOne({
        email: email.toLowerCase(),
        'applications.applicationId': applicationId,
      })
      .exec();
    if (!document) {
      return null;
    }
    return this.toEntity(document);
  }

  async addApplication(
    userId: string,
    application: UserApplication,
  ): Promise<User> {
    const document = await this.model
      .findByIdAndUpdate(
        userId,
        {
          $push: { applications: application },
          $set: { updatedAt: new Date() },
        },
        { new: true },
      )
      .exec();
    if (!document) {
      throw new Error('User not found');
    }
    return this.toEntity(document);
  }

  async hasAuthProvider(
    userId: string,
    provider: AuthProviderType,
  ): Promise<boolean> {
    const document = await this.model
      .findOne({
        _id: userId,
        'authProviders.provider': provider,
      })
      .exec();
    return document !== null;
  }
}

