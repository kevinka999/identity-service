import {
  User,
  UserPayload,
  AuthProviderType,
  UserApplication,
} from '../entities/user.entity';
import { BaseRepository } from './base.repository.interface';

export interface IUserRepository extends BaseRepository<User, UserPayload> {
  findByEmail(email: string): Promise<User | null>;
  findByEmailAndApplication(
    email: string,
    applicationId: string,
  ): Promise<User | null>;
  addApplication(userId: string, application: UserApplication): Promise<User>;
  hasAuthProvider(userId: string, provider: AuthProviderType): Promise<boolean>;
}

export const USER_REPOSITORY_TOKEN = Symbol('UserRepository');
