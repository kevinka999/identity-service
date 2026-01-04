import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY_TOKEN } from '../../domain/repositories/application.repository.interface';
import type { IApplicationRepository } from '../../domain/repositories/application.repository.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class ApplicationGuard implements CanActivate {
  constructor(
    @Inject(APPLICATION_REPOSITORY_TOKEN)
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['x-client-id'] as string;

    if (!clientId) {
      throw new UnauthorizedException('x-client-id header is required');
    }

    const application =
      await this.applicationRepository.findByClientId(clientId);

    if (!application) {
      throw new UnauthorizedException('Invalid application clientId');
    }

    if (!application.isActive) {
      throw new UnauthorizedException('Application is not active');
    }

    request.application = application;

    return true;
  }
}
