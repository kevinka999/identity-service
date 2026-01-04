import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenPayload,
} from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { BaseRepositoryImpl } from './base.repository.impl';
import { RefreshTokenDocument } from '../database/schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository
  extends BaseRepositoryImpl<
    RefreshToken,
    RefreshTokenPayload,
    RefreshTokenDocument
  >
  implements IRefreshTokenRepository
{
  constructor(
    @InjectModel('RefreshToken')
    protected readonly model: Model<RefreshTokenDocument>,
  ) {
    super(model);
  }

  protected toEntity(document: RefreshTokenDocument): RefreshToken {
    return new RefreshToken({
      _id: document._id.toString(),
      userId: document.userId,
      applicationId: document.applicationId,
      tokenHash: document.tokenHash,
      expiresAt: document.expiresAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  async findByUserAndApplication(
    userId: string,
    applicationId: string,
  ): Promise<RefreshToken | null> {
    const document = await this.model
      .findOne({ userId, applicationId })
      .exec();
    if (!document) {
      return null;
    }
    return this.toEntity(document);
  }

  async deleteByUserAndApplication(
    userId: string,
    applicationId: string,
  ): Promise<boolean> {
    const result = await this.model
      .deleteOne({ userId, applicationId })
      .exec();
    return result.deletedCount > 0;
  }
}

