export interface RefreshTokenPayload {
  _id?: string;
  userId: string;
  applicationId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RefreshToken {
  public _id: string;
  public userId: string;
  public applicationId: string;
  public tokenHash: string;
  public expiresAt: Date;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(payload: RefreshTokenPayload) {
    this._id = payload._id || '';
    this.userId = payload.userId;
    this.applicationId = payload.applicationId;
    this.tokenHash = payload.tokenHash;
    this.expiresAt = payload.expiresAt;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}
