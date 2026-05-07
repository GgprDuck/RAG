import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaEmbeddings } from '@langchain/ollama';
import { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';
import { RAG_CONFIG, TRagConfig } from '../config/rag-config';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

@Injectable()
export class LangChainEmbeddingAdapter implements IEmbeddingPort {
  constructor(
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async embed(text: string): Promise<number[] | null> {
    const ragConfig = this.configService.get<TRagConfig>(RAG_CONFIG);
    if (!ragConfig) {
      throw new Error('RAG_CONFIG is not registered');
    }
    const model = ragConfig.ollamaEmbedModelText;
    const baseUrl = ragConfig.ollamaBaseUrl;
    if (!model?.trim()) {
      throw new Error('ollamaEmbedModelText is not configured in rag-config');
    }
    if (!baseUrl?.trim()) {
      throw new Error('ollamaBaseUrl is not configured in rag-config');
    }

    try {
      const embeddings = new OllamaEmbeddings({
        model,
        baseUrl,
      });
      const vector = await embeddings.embedQuery(text);
      if (!Array.isArray(vector) || vector.length === 0) return null;
      return vector;
    } catch (error: any) {
      this.logger.warn('LangChain embedding failed', { error: error?.message });
      return null;
    }
  }
}
