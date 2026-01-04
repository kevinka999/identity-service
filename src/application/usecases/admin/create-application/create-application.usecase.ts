import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { APPLICATION_REPOSITORY_TOKEN } from '../../../../domain/repositories/application.repository.interface';
import type { IApplicationRepository } from '../../../../domain/repositories/application.repository.interface';
import { CreateApplicationDto } from './create-application.dto';
import { Application } from '../../../../domain/entities/application.entity';
import * as crypto from 'crypto';

@Injectable()
export class CreateApplicationUsecase {
  private readonly MAX_RETRIES = 5;

  constructor(
    @Inject(APPLICATION_REPOSITORY_TOKEN)
    private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(dto: CreateApplicationDto): Promise<Application> {
    const clientId = await this.generateUniqueClientId();
    const clientSecret = this.generateClientSecret();

    const applicationPayload = {
      name: dto.name,
      clientId,
      clientSecret,
      scopes: dto.scopes ?? [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const application =
      await this.applicationRepository.create(applicationPayload);

    return application;
  }

  private async generateUniqueClientId(): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const clientId = crypto.randomBytes(12).toString('hex');

      const existing =
        await this.applicationRepository.findByClientId(clientId);

      if (!existing) {
        return clientId;
      }
    }

    throw new ConflictException(
      'Failed to generate unique clientId after multiple attempts',
    );
  }

  private generateClientSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
