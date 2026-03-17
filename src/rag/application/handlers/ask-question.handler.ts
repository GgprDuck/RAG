import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { IConfidencePort } from "src/rag/domain/ports/confidence.port";
import { TextRagPort } from "src/rag/domain/ports/textRagPort";
import { LoggerPort } from "src/rag/shared/application/ports/logger.port";
import { AskQuestionCommand } from "../commands/ask-question.command";
import { IGenerateAnswer, IStreamChunk } from "../common/interfaces/rag-documents.interfaces";

@Injectable()
export class AskQuestionHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
    @Inject('IConfidencePort') private readonly confidencePort: IConfidencePort,
  ) {}

  async execute(cmd: AskQuestionCommand): Promise<IGenerateAnswer> {
    if (!cmd.question || typeof cmd.question !== 'string' || !cmd.question.trim()) {
      this.logger.log('AskQuestion_Invalid', { q: cmd.question });
      throw new BadRequestException('A valid question must be provided.');
    }

    const opts = cmd.options;

    this.logger.log('AskQuestion', {
      q: cmd.question,
      limit:             opts?.limit,
      scoreThreshold:    opts?.scoreThreshold,
      useHybridSearch:   opts?.useHybridSearch,
      useReranking:      opts?.useReranking,
      rerankStrategy:    opts?.rerankStrategy,
      useQueryTransform: opts?.useQueryTransformation,
      useCompression:    opts?.useContextualCompression,
      useMemory:         opts?.useConversationMemory,
      useCitations:      opts?.useCitationTracking,
      useKG:             opts?.useKnowledgeGraph,
      temperature:       opts?.temperature,
      maxTokens:         opts?.maxTokens,
      includeSources:    opts?.includeSources,
      hasHistory:        (opts?.conversationHistory?.length ?? 0) > 0,
      hasFilters:        (opts?.filters?.length ?? 0) > 0,
    });

    const raw = await this.textRag.generateAnswer(cmd.question, {
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
      useKnowledgeGraph:        opts?.useKnowledgeGraph,
      temperature:              opts?.temperature,
      topP:                     opts?.topP,
      topK:                     opts?.topK,
      maxTokens:                opts?.maxTokens,
      includeSources:           opts?.includeSources,
      sessionId:                opts?.sessionId,
      conversationHistory:      opts?.conversationHistory,
    });

    if (typeof raw === 'string') {
      return { answer: raw };
    }

    const chunks = (raw.sources?.length ? raw.sources : (raw.citations ?? []))
      .map((s: { text: string }) => s.text)
      .filter(Boolean);

      const verification = await this.confidencePort.verify(raw.answer, chunks);

      this.logger.log('AskQuestion_Confidence', {
        score:               verification.confidence.score,
        tier:                verification.confidence.tier,
        grounded:            verification.grounded,
        llmVerificationUsed: verification.llmVerificationUsed,
        llmVerdict:          verification.llmVerdict,
      });
      
      let finalAnswer = raw.answer;
      
      if (!verification.grounded && verification.llmVerdict === 'NO') {
        finalAnswer = 'Немає релевантної відповіді';
      }
      
      return {
        ...raw,
        confidence: verification.confidence.score,
        formattedAnswer: finalAnswer,
      };
  }

  streamableExecute(cmd: AskQuestionCommand): AsyncGenerator<IStreamChunk> {
    if (!cmd.question || typeof cmd.question !== 'string' || !cmd.question.trim()) {
      this.logger.log('AskQuestion_Stream_Invalid', { q: cmd.question });
      return (async function* () {
        yield { event: 'error' as const, error: 'A valid question must be provided.' };
      })();
    }

    const opts = cmd.options;

    this.logger.log('AskQuestion_Stream', {
      q:          cmd.question,
      hasFilters: (opts?.filters?.length ?? 0) > 0,
    });

    return this.textRag.streamableGenerateAnswer(cmd.question, {
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
      useKnowledgeGraph:        opts?.useKnowledgeGraph,
      temperature:              opts?.temperature,
      topP:                     opts?.topP,
      topK:                     opts?.topK,
      maxTokens:                opts?.maxTokens,
      includeSources:           opts?.includeSources,
      sessionId:                opts?.sessionId,
      conversationHistory:      opts?.conversationHistory,
    });
  }
}