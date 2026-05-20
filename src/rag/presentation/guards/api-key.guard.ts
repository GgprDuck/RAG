import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RAG_CONFIG, TRagConfig } from 'src/rag/infrastructure/config/rag-config';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const ragConfig = this.configService.get<TRagConfig>(RAG_CONFIG);
    const expectedApiKey = ragConfig?.apiKey?.trim();
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const isProduction = nodeEnv === 'production';
    // Dev/staging: open by default when no key; set RAG_ALLOW_OPEN=false to test auth locally.
    const allowOpenInNonProd = ragConfig?.allowOpenApi !== false;

    if (!expectedApiKey) {
      if (isProduction) {
        this.logger.error('RAG_API_KEY is required in production');
        throw new UnauthorizedException('API key is not configured');
      }
      if (!allowOpenInNonProd) {
        this.logger.warn(
          'RAG_API_KEY unset and open access disabled (RAG_ALLOW_OPEN=false)',
        );
        throw new UnauthorizedException('API key is not configured');
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const receivedApiKey = request.headers['x-api-key'] ?? request.headers.authorization;
    const normalizedReceived = (receivedApiKey ?? '').replace(/^Bearer\s+/i, '').trim();

    if (normalizedReceived !== expectedApiKey) {
      this.logger.warn('Unauthorized API request rejected by ApiKeyGuard');
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
