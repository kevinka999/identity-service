export interface GenerateAccessTokenResponse {
  accessToken: string;
}

export interface GenerateRefreshTokenResponse {
  refreshToken: string;
}

export interface IAuthService {
  generateAccessToken(
    userId: string,
    email: string,
    applicationId: string,
  ): Promise<string>;
  generateRefreshToken(userId: string, applicationId: string): Promise<string>;
}

export const AUTH_SERVICE_TOKEN = Symbol('AuthService');
