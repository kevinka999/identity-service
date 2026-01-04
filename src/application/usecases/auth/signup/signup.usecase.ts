import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { CRYPTO_SERVICE_TOKEN } from '../../../../domain/services/crypto.service.interface';
import type { ICryptoService } from '../../../../domain/services/crypto.service.interface';
import { SignupDto } from './signup.dto';
import { User } from '../../../../domain/entities/user.entity';
import { UserApplication } from '../../../../domain/entities/user.entity';
import { Application } from '../../../../domain/entities/application.entity';

@Injectable()
export class SignupUsecase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(CRYPTO_SERVICE_TOKEN)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(dto: SignupDto, application: Application): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser)
      return this.handleExistingUser(existingUser, dto, application);

    return this.handleNewUser(dto, application);
  }

  private async handleNewUser(
    dto: SignupDto,
    application: Application,
  ): Promise<User> {
    const passwordHash = await this.cryptoService.hashPassword(dto.password);

    const userApplication: UserApplication = {
      applicationId: application._id,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
    };

    const newUser = await this.userRepository.create({
      email: dto.email.toLowerCase(),
      emailVerified: false,
      authProviders: [
        {
          provider: 'local',
          passwordHash,
          createdAt: new Date(),
        },
      ],
      applications: [userApplication],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return newUser;
  }

  private async handleExistingUser(
    existingUser: User,
    dto: SignupDto,
    application: Application,
  ): Promise<User> {
    const isAssociated = existingUser.applications.some(
      (app) => app.applicationId === application._id,
    );

    if (isAssociated) {
      throw new ConflictException(
        'User already exists and is associated with this application',
      );
    }

    const userApplication: UserApplication = {
      applicationId: application._id,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
    };

    const hasLocalProvider = existingUser.authProviders.some(
      (p) => p.provider === 'local',
    );

    if (!hasLocalProvider) {
      const passwordHash = await this.cryptoService.hashPassword(dto.password);
      existingUser.authProviders.push({
        provider: 'local',
        passwordHash,
        createdAt: new Date(),
      });
      await this.userRepository.update(existingUser._id, {
        authProviders: existingUser.authProviders,
      });
    }

    return this.userRepository.addApplication(
      existingUser._id,
      userApplication,
    );
  }
}
