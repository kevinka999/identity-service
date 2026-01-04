export interface ValidateCredentialResponse {
  email?: string;
  name?: string;
  picture?: string;
}

export interface IGoogleService {
  validateCredential(credential: string): Promise<ValidateCredentialResponse>;
}

export const GOOGLE_SERVICE_TOKEN = Symbol('GoogleService');
