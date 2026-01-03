export interface ApplicationPayload {
  _id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Application {
  public _id: string;
  public name: string;
  public clientId: string;
  public clientSecret: string;
  public scopes: string[];
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(payload: ApplicationPayload) {
    this._id = payload._id;
    this.name = payload.name;
    this.clientId = payload.clientId;
    this.clientSecret = payload.clientSecret;
    this.scopes = payload.scopes;
    this.isActive = payload.isActive;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

