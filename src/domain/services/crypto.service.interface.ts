export interface ICryptoService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  hash(value: string, saltRounds?: number): Promise<string>;
  compare(value: string, hash: string): Promise<boolean>;
}

export const CRYPTO_SERVICE_TOKEN = Symbol('CryptoService');
