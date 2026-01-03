import {
  Application,
  ApplicationPayload,
} from '../entities/application.entity';
import { BaseRepository } from './base.repository.interface';

export interface ApplicationRepository extends BaseRepository<
  Application,
  ApplicationPayload
> {}

export const APPLICATION_REPOSITORY_TOKEN = Symbol('ApplicationRepository');
