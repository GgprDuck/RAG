import { Inject, Injectable } from '@nestjs/common';
import { CachePort } from 'src/rag/domain/ports/cache.port';
import type { IRagSettingsPort } from 'src/rag/domain/ports/rag-settings.port';
import { AskQuestionOptions } from 'src/rag/domain/interfaces/ask-question.interface';
import { IGenerateAnswer } from '../common/interfaces/rag-documents.interfaces';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

const ANSWER_CACHE_PREFIX = 'answer_cache:';

@Injectable()
export class RagCacheService {
  constructor(
    @Inject('CachePort') private readonly cache: CachePort,
    @Inject('IRagSettingsPort') private readonly ragSettings: IRagSettingsPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  shouldUseAnswerCache(options?: AskQuestionOptions): boolean {
    if (options?.useAnswerCache === false) return false;
    if (options?.sessionId) return false;
    if ((options?.conversationHistory?.length ?? 0) > 0) return false;
    if (options?.useConversationMemory) return false;
    return true;
  }

  private normalizeCacheQuery(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 600);
  }

  getAnswerCacheKey(query: string, options?: AskQuestionOptions): string {
    const payload = {
      q: this.normalizeCacheQuery(query),
      limit: options?.limit,
      scoreThreshold: options?.scoreThreshold,
      useHybridSearch: options?.useHybridSearch,
      useReranking: options?.useReranking,
      rerankStrategy: options?.rerankStrategy,
      useQueryTransformation: options?.useQueryTransformation,
      useContextualCompression: options?.useContextualCompression,
      useKnowledgeGraph: options?.useKnowledgeGraph,
      useCitationTracking: options?.useCitationTracking,
      filters: options?.filters,
      includeSources: options?.includeSources,
      topP: options?.topP,
      topK: options?.topK,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    };
    return `${ANSWER_CACHE_PREFIX}${JSON.stringify(payload)}`;
  }

  async getCachedAnswer(
    query: string,
    options?: AskQuestionOptions,
  ): Promise<IGenerateAnswer | null> {
    if (!this.shouldUseAnswerCache(options)) return null;

    const key = this.getAnswerCacheKey(query, options);
    try {
      const cached = await this.cache.get<IGenerateAnswer>(key);
      if (!cached) return null;
      if (typeof cached === 'string') {
        return JSON.parse(cached) as IGenerateAnswer;
      }
      return cached;
    } catch (err: any) {
      this.logger.warn('Answer cache get failed', { error: err?.message });
      return null;
    }
  }

  async setCachedAnswer(
    query: string,
    options: AskQuestionOptions | undefined,
    answer: IGenerateAnswer,
  ): Promise<void> {
    if (!this.shouldUseAnswerCache(options)) return;

    const { answerCacheTtlSec } = this.ragSettings.get();
    const key = this.getAnswerCacheKey(query, options);
    try {
      await this.cache.set(key, answer, answerCacheTtlSec);
    } catch (err: any) {
      this.logger.warn('Answer cache set failed', { error: err?.message });
    }
  }

  async invalidateAnswerCache(): Promise<void> {
    if (!this.cache.deleteByPattern) {
      this.logger.warn('Answer cache invalidation skipped: deleteByPattern unavailable');
      return;
    }
    try {
      await this.cache.deleteByPattern(`${ANSWER_CACHE_PREFIX}*`);
      this.logger.log('Answer cache invalidated');
    } catch (err: any) {
      this.logger.warn('Answer cache invalidation failed', { error: err?.message });
    }
  }
}
