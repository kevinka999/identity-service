export type AuthProviderType = 'local' | 'google';

export interface AuthProvider {
  provider: AuthProviderType;
  providerUserId?: string;
  passwordHash?: string;
  createdAt: Date;
}

export type UserApplicationStatus = 'active' | 'blocked';

export interface UserApplication {
  applicationId: string;
  role: string;
  status: UserApplicationStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UserPayload {
  _id?: string;
  email: string;
  emailVerified: boolean;
  authProviders: AuthProvider[];
  applications: UserApplication[];
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  public _id: string;
  public email: string;
  public emailVerified: boolean;
  public authProviders: AuthProvider[];
  public applications: UserApplication[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(payload: UserPayload) {
    this._id = payload._id || '';
    this.email = payload.email;
    this.emailVerified = payload.emailVerified;
    this.authProviders = payload.authProviders;
    this.applications = payload.applications;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}
