import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (
        typeof res === 'object' &&
        res !== null &&
        'message' in res &&
        typeof (res as { message: unknown }).message === 'string'
      ) {
        message = (res as { message: string }).message;
      } else if (typeof res === 'string') {
        message = res;
      } else {
        message = exception.message || 'Internal server error';
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    const method =
      typeof request === 'object' && request !== null && 'method' in request
        ? (request as { method: string }).method
        : 'UNKNOWN';

    const url =
      typeof request === 'object' && request !== null && 'originalUrl' in request
        ? (request as { originalUrl: string }).originalUrl
        : typeof request === 'object' && request !== null && 'url' in request
        ? (request as { url: string }).url
        : 'UNKNOWN';

    if (status === 500) {
      const trace =
        exception instanceof Error ? exception.stack : JSON.stringify(exception);
      this.logger.error(
        `[UNHANDLED ERROR] ${method} ${url} at ${new Date().toISOString()}`,
        trace,
      );
    } else {
      this.logger.warn(`[${status}] ${method} ${url}: ${message}`);
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      typeof (response as { status: (s: number) => { json: (body: object) => void } }).status === 'function'
    ) {
      (response as { status: (s: number) => { json: (body: object) => void } })
        .status(status)
        .json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: url,
          message: status === 500 ? 'Internal server error' : message,
        });
    }
  }
}