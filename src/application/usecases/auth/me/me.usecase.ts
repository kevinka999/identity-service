import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { Application } from '../../../../domain/entities/application.entity';

export interface MeResponse {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class MeUsecase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, application: Application): Promise<MeResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id,
      email: user.email,
      role:
        user.applications.find((app) => app.applicationId === application._id)
          ?.role || '',
    };
  }
}
