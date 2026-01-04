import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminPassKey = request.headers['x-admin-pass-key'] as string;
    const expectedPassKey = this.configService.get<string>('ADMIN_PASS_KEY');

    if (!expectedPassKey) {
      throw new UnauthorizedException(
        'Admin pass key not configured on server',
      );
    }

    if (!adminPassKey) {
      throw new UnauthorizedException('x-admin-pass-key header is required');
    }

    if (adminPassKey !== expectedPassKey) {
      throw new UnauthorizedException('Invalid admin pass key');
    }

    return true;
  }
}
