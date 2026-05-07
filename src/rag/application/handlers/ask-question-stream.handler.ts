import { Injectable, Inject } from '@nestjs/common';
import { TextRagPort } from 'src/rag/domain/ports/textRagPort';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { AskQuestionStreamCommand } from '../commands/ask-question-stream.command';
import { IStreamChunk } from '../common/interfaces/rag-documents.interfaces';

@Injectable()
export class AskQuestionStreamHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  execute(cmd: AskQuestionStreamCommand): Promise<AsyncGenerator<IStreamChunk>> {
    if (!cmd.question || typeof cmd.question !== 'string' || !cmd.question.trim()) {
      this.logger.log('AskQuestion_Stream_Invalid', { q: cmd.question });
      const errorStream = (async function* () {
        yield { event: 'error' as const, error: 'A valid question must be provided.' };
      })();
      return Promise.resolve(errorStream);
    }

    const opts = cmd.options;

    this.logger.log('AskQuestion_Stream', {
      q:          cmd.question,
      hasFilters: (opts?.filters?.length ?? 0) > 0,
    });

    return Promise.resolve(
      this.textRag.streamableGenerateAnswer(cmd.question, {
        limit:                    opts?.limit,
        scoreThreshold:           opts?.scoreThreshold,
        filters:                  opts?.filters,
        useHybridSearch:          opts?.useHybridSearch,
        useReranking:             opts?.useReranking,
        rerankStrategy:           opts?.rerankStrategy,
        useQueryTransformation:   opts?.useQueryTransformation,
        useContextualCompression: opts?.useContextualCompression,
        useConversationMemory:    opts?.useConversationMemory,
        useCitationTracking:      opts?.useCitationTracking,
        includeRetrievalDiagnostics: opts?.includeRetrievalDiagnostics,
        useAnswerCache:           opts?.useAnswerCache,
        useKnowledgeGraph:        opts?.useKnowledgeGraph,
        temperature:              opts?.temperature,
        topP:                     opts?.topP,
        topK:                     opts?.topK,
        maxTokens:                opts?.maxTokens,
        includeSources:           opts?.includeSources,
        sessionId:                opts?.sessionId,
        conversationHistory:      opts?.conversationHistory,
      }),
    );
  }
}
