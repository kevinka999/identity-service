import { User, UserPayload } from '../entities/user.entity';
import { BaseRepository } from './base.repository.interface';

export interface UserRepository extends BaseRepository<User, UserPayload> {}

export const USER_REPOSITORY_TOKEN = Symbol('UserRepository');
