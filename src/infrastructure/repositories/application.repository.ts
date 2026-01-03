import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Application,
  ApplicationPayload,
} from '../../domain/entities/application.entity';
import { ApplicationRepository as IApplicationRepository } from '../../domain/repositories/application.repository.interface';
import { BaseRepositoryImpl } from './base.repository.impl';
import { ApplicationDocument } from '../database/schemas/application.schema';

@Injectable()
export class ApplicationRepository
  extends BaseRepositoryImpl<
    Application,
    ApplicationPayload,
    ApplicationDocument
  >
  implements IApplicationRepository
{
  constructor(
    @InjectModel('Application')
    protected readonly model: Model<ApplicationDocument>,
  ) {
    super(model);
  }

  protected toEntity(document: ApplicationDocument): Application {
    return new Application({
      _id: document._id.toString(),
      name: document.name,
      clientId: document.clientId,
      clientSecret: document.clientSecret,
      scopes: document.scopes,
      isActive: document.isActive,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
