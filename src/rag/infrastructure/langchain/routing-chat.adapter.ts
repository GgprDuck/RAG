import { Inject, Injectable } from '@nestjs/common';
import { IChatLlmPort, LlmOptions } from 'src/rag/domain/ports/chat-llm.port';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

@Injectable()
export class RoutingChatAdapter implements IChatLlmPort {
  constructor(
    @Inject('PrimaryChatLlmPort') private readonly primary: IChatLlmPort,
    @Inject('SecondaryChatLlmPort') private readonly secondary: IChatLlmPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async complete(prompt: string, options?: LlmOptions): Promise<string> {
    try {
      this.logger.log('llm.routing.complete', { route: 'primary', reason: 'default' });
      return await this.primary.complete(prompt, options);
    } catch (primaryError: any) {
      this.logger.warn('llm.routing.complete.fallback', {
        route: 'secondary',
        reason: 'primary_failed',
        error: primaryError?.message,
      });
      return this.secondary.complete(prompt, options);
    }
  }

  async *stream(prompt: string, options?: LlmOptions): AsyncGenerator<string> {
    try {
      this.logger.log('llm.routing.stream', { route: 'primary', reason: 'default' });
      for await (const token of this.primary.stream(prompt, options)) {
        yield token;
      }
      return;
    } catch (primaryError: any) {
      this.logger.warn('llm.routing.stream.fallback', {
        route: 'secondary',
        reason: 'primary_failed',
        error: primaryError?.message,
      });
      for await (const token of this.secondary.stream(prompt, options)) {
        yield token;
      }
    }
  }

  async describeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      return await this.primary.describeImage(imageBuffer, mimeType);
    } catch {
      return this.secondary.describeImage(imageBuffer, mimeType);
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    try {
      return await this.primary.extractKeywords(text);
    } catch {
      return this.secondary.extractKeywords(text);
    }
  }
}
