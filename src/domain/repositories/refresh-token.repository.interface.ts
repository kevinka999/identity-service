import {
  RefreshToken,
  RefreshTokenPayload,
} from '../entities/refresh-token.entity';
import { BaseRepository } from './base.repository.interface';

export interface IRefreshTokenRepository extends BaseRepository<
  RefreshToken,
  RefreshTokenPayload
> {
  findByUserAndApplication(
    userId: string,
    applicationId: string,
  ): Promise<RefreshToken | null>;
  deleteByUserAndApplication(
    userId: string,
    applicationId: string,
  ): Promise<boolean>;
}

export const REFRESH_TOKEN_REPOSITORY_TOKEN = Symbol('RefreshTokenRepository');
