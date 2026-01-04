import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ICryptoService } from '../../domain/services/crypto.service.interface';

@Injectable()
export class CryptoService implements ICryptoService {
  private readonly DEFAULT_SALT_ROUNDS = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.DEFAULT_SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hash(value: string, saltRounds?: number): Promise<string> {
    const rounds = saltRounds ?? this.DEFAULT_SALT_ROUNDS;
    return bcrypt.hash(value, rounds);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
