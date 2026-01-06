import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, query, body } = request;

    const params: Record<string, unknown> = {};

    if (query && typeof query === 'object' && Object.keys(query).length > 0) {
      params.query = query;
    }

    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      params.body = body;
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${url}${Object.keys(params).length > 0 ? ` - ${JSON.stringify(params)}` : ''}`,
        );
      }),
    );
  }
}
