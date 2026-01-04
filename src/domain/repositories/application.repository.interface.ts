import {
  Application,
  ApplicationPayload,
} from '../entities/application.entity';
import { BaseRepository } from './base.repository.interface';

export interface IApplicationRepository extends BaseRepository<
  Application,
  ApplicationPayload
> {
  findByClientId(clientId: string): Promise<Application | null>;
}

export const APPLICATION_REPOSITORY_TOKEN = Symbol('ApplicationRepository');
