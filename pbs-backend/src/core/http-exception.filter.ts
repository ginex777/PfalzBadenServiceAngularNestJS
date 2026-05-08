import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Sentry, isSentryEnabled } from './sentry.util';

type RequestWithId = Request & { id?: string };

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Interner Serverfehler';

    const errorBody =
      typeof message === 'string'
        ? { statusCode: status, message, path: request.url }
        : { ...message, path: request.url };

    const requestId = request.id;
    const method = request.method;
    const url = request.url;

    if (status >= 500) {
      if (isSentryEnabled()) {
        Sentry.captureException(exception, {
          tags: { requestId: requestId ?? 'unknown' },
          extra: { method, url, status },
        });
      }
      this.logger.error(
        {
          requestId,
          method,
          url,
          status,
          error:
            exception instanceof Error
              ? {
                  name: exception.name,
                  message: exception.message,
                  stack: exception.stack,
                }
              : String(exception),
        },
        'unhandled exception',
      );
    } else {
      this.logger.warn(
        { requestId, method, url, status, error: message },
        'request failed',
      );
    }

    response.status(status).json(errorBody);
  }
}
