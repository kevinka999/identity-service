import {
  Catch,
  ExceptionFilter,
  Logger,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      typeof exception?.status === 'number'
        ? exception.status
        : typeof exception?.response?.statusCode === 'number'
          ? exception.response.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception?.response?.message ??
      exception?.message ??
      'Internal server error';

    this.logger.error(
      `
${request?.method} ${request?.url}
Status: ${status}
Message: ${JSON.stringify(message)}
      `,
      exception?.stack,
    );

    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request?.url,
        message,
      });
    }
  }
}
