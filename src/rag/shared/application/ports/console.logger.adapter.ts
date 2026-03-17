import { Injectable } from '@nestjs/common';
import { LoggerPort } from '../../application/ports/logger.port';

@Injectable()
export class ConsoleLoggerAdapter implements LoggerPort {
  log(message: string, meta?: Record<string, unknown>) {
    console.log('[INFO]', message, meta ?? '');
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn('[WARN]', message, meta ?? '');
  }

  error(message: string, meta?: Record<string, unknown>) {
    console.error('[ERROR]', message, meta ?? '');
  }
}
