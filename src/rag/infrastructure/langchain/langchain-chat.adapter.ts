import { Inject, Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOllama } from '@langchain/ollama';
import { ConfigService } from '@nestjs/config';
import { IChatLlmPort, LlmOptions } from 'src/rag/domain/ports/chat-llm.port';
import { RAG_CONFIG, TRagConfig } from '../config/rag-config';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { OllamaService } from '../ollama/ollama.service';

@Injectable()
export class LangChainChatAdapter implements IChatLlmPort {
  constructor(
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
    private readonly ollamaService: OllamaService,
  ) {}

  async complete(prompt: string, options?: LlmOptions): Promise<string> {
    const chain = this.buildPromptChain(options);
    return chain.invoke({ prompt });
  }

  async *stream(prompt: string, options?: LlmOptions): AsyncGenerator<string> {
    const chain = this.buildPromptChain(options);
    const stream = await chain.stream({ prompt });
    for await (const chunk of stream) {
      if (chunk) yield chunk;
    }
  }

  async describeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
    return this.ollamaService.describeImage({
      buffer: imageBuffer,
      mimetype: mimeType,
    } as Express.Multer.File);
  }

  async extractKeywords(text: string): Promise<string[]> {
    const prompt = [
      'You extract search keywords from text.',
      'Return ONLY JSON array like ["cat","dog"]',
      '3-10 keywords max.',
      `Text: ${text}`,
    ].join('\n');

    try {
      const raw = await this.complete(prompt, { temperature: 0 });
      return JSON.parse(raw);
    } catch (error: any) {
      this.logger.warn('LangChain keyword extraction failed', { error: error?.message });
      return this.ollamaService.extractKeywords(text);
    }
  }

  private buildPromptChain(options?: LlmOptions) {
    const ragConfig = this.configService.get<TRagConfig>(RAG_CONFIG);
    if (!ragConfig) {
      throw new Error('RAG_CONFIG is not registered');
    }
    const model = ragConfig.ollamaChatModel;
    const baseUrl = ragConfig.ollamaBaseUrl;
    if (!model?.trim()) {
      throw new Error('ollamaChatModel is not configured in rag-config');
    }
    if (!baseUrl?.trim()) {
      throw new Error('ollamaBaseUrl is not configured in rag-config');
    }

    const chatModel = new ChatOllama({
      model,
      baseUrl,
      temperature: options?.temperature ?? 0,
      topP: options?.topP,
      topK: options?.topK,
      numPredict: options?.maxTokens,
      repeatPenalty: options?.repeatPenalty,
      seed: options?.seed,
      stop: options?.stop,
    });

    return ChatPromptTemplate.fromMessages([
      ['human', '{prompt}'],
    ])
      .pipe(chatModel)
      .pipe(new StringOutputParser());
  }
}
