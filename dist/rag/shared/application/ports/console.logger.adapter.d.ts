import { LoggerPort } from '../../application/ports/logger.port';
export declare class ConsoleLoggerAdapter implements LoggerPort {
    log(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
