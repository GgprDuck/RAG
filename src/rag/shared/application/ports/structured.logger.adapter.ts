import { Injectable, Logger } from '@nestjs/common';
import { LoggerPort } from '../../application/ports/logger.port';

@Injectable()
export class StructuredLoggerAdapter implements LoggerPort {
  private readonly logger = new Logger('Rag');

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.log(this.format(message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(this.format(message, meta));
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(this.format(message, meta));
  }

  private format(message: string, meta?: Record<string, unknown>): string {
    if (!meta) return message;
    return `${message} ${JSON.stringify(meta)}`;
  }
}
