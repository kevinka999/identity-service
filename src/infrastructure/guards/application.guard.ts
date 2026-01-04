import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY_TOKEN } from '../../domain/repositories/application.repository.interface';
import type { IApplicationRepository } from '../../domain/repositories/application.repository.interface';
import { Inject } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ApplicationGuard implements CanActivate {
  constructor(
    @Inject(APPLICATION_REPOSITORY_TOKEN)
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['x-client-id'] as string;
    const clientSecret = request.headers['x-client-secret'] as string;

    if (!clientId) {
      throw new UnauthorizedException('x-client-id header is required');
    }

    if (!clientSecret) {
      throw new UnauthorizedException('x-client-secret header is required');
    }

    const application =
      await this.applicationRepository.findByClientId(clientId);

    if (!application) {
      throw new UnauthorizedException('Invalid application clientId');
    }

    if (!application.isActive) {
      throw new UnauthorizedException('Application is not active');
    }

    if (!this.isClientSecretValid(clientSecret, application.clientSecret)) {
      throw new UnauthorizedException('Invalid application clientSecret');
    }

    request.application = application;

    return true;
  }

  private isClientSecretValid(
    providedSecret: string,
    storedSecret: string,
  ): boolean {
    if (providedSecret.length !== storedSecret.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(providedSecret),
        Buffer.from(storedSecret),
      );
    } catch {
      return false;
    }
  }
}
