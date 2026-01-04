import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import {
  IGoogleService,
  ValidateCredentialResponse,
} from '../../domain/services/google.service.interface';

@Injectable()
export class GoogleService implements IGoogleService {
  private readonly client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }
    this.client = new OAuth2Client(clientId);
  }

  async validateCredential(
    credential: string,
  ): Promise<ValidateCredentialResponse> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error) {
      throw new Error(`Google credential validation failed: ${error}`);
    }
  }
}
