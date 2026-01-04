import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Application } from '../../domain/entities/application.entity';

export const ApplicationFromRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Application => {
    const request = ctx.switchToHttp().getRequest();
    return request.application as Application;
  },
);

