import { Injectable, Inject } from '@nestjs/common';
import {
  ConfidenceThresholds,
  ConfidenceScore,
  VerificationResult,
  ConfidenceTier,
} from 'src/rag/domain/interfaces/confidence.interface';
import { IConfidencePort } from 'src/rag/domain/ports/confidence.port';
import type { IRagSettingsPort } from 'src/rag/domain/ports/rag-settings.port';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

interface IEmbeddingPort {
  embed(text: string): Promise<number[]>;
}

interface IChatLlmPort {
  complete(prompt: string): Promise<string>;
}

@Injectable()
export class ConfidenceService implements IConfidencePort {
  private readonly MAX_EMBED_CHARS = 5000;
  private readonly MAX_CHUNKS_TO_COMPARE = 5;

  constructor(
    @Inject('IEmbeddingPort')
    private readonly embeddingPort: IEmbeddingPort,
    @Inject('IChatLlmPort')
    private readonly chatPort: IChatLlmPort,
    @Inject('IRagSettingsPort')
    private readonly ragSettings: IRagSettingsPort,
    @Inject('LoggerPort')
    private readonly logger: LoggerPort,
  ) {}

  async computeScore(
    answer: string,
    retrievedChunks: string[],
    thresholds?: Partial<ConfidenceThresholds>,
  ): Promise<ConfidenceScore> {
    const t = this.resolveThresholds(thresholds);

    if (!answer?.trim() || !retrievedChunks.length) {
      return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
    }

    const filteredChunks = this.filterChunksByKeywords(retrievedChunks, answer);

    if (!filteredChunks.length) {
      return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
    }

    const topChunks = filteredChunks.slice(0, this.MAX_CHUNKS_TO_COMPARE);

    const answerVec = await this.safeEmbed(answer);
    if (!answerVec) {
      return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
    }

    const chunkVectors = await Promise.all(
      topChunks.map((chunk) => this.safeEmbed(chunk)),
    );

    let bestScore = -1;
    let bestChunkIndex = 0;

    for (let i = 0; i < chunkVectors.length; i++) {
      const chunkVec = chunkVectors[i];
      if (!chunkVec) continue;

      const sim = cosineSimilarity(answerVec, chunkVec);

      if (sim > bestScore) {
        bestScore = sim;
        bestChunkIndex = i;
      }
    }

    if (bestScore === -1) {
      return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
    }

    const tier = this.scoreTier(bestScore, t);

    this.logger.log('Confidence_ComputeScore', {
      score: Number(bestScore.toFixed(3)),
      tier,
    });

    return {
      score: bestScore,
      tier,
      bestChunkIndex,
    };
  }

  async verify(
    answer: string,
    retrievedChunks: string[],
    thresholds?: Partial<ConfidenceThresholds>,
  ): Promise<VerificationResult> {
    if (!answer?.trim() || !retrievedChunks.length) {
      return {
        grounded: false,
        confidence: { score: 0, tier: 'LOW', bestChunkIndex: 0 },
        llmVerificationUsed: false,
        message: 'Немає релевантної відповіді',
      };
    }

    const confidence = await this.computeScore(answer, retrievedChunks, thresholds);

    if (confidence.tier === 'LOW') {
      return {
        grounded: false,
        confidence,
        llmVerificationUsed: false,
        message: 'Немає релевантної відповіді',
      };
    }

    if (confidence.tier === 'HIGH') {
      return {
        grounded: true,
        confidence,
        llmVerificationUsed: false,
      };
    }

    const bestContext = retrievedChunks[confidence.bestChunkIndex];

    const llmScore = await this.llmRelevanceScore(answer, bestContext);

    const settings = this.ragSettings.get();
    const finalScore = (confidence.score + llmScore) / 2;
    const grounded = finalScore >= settings.confidenceGrayZoneFinal;

    return {
      grounded,
      confidence: {
        ...confidence,
        score: finalScore,
      },
      llmVerificationUsed: true,
      llmVerdict: llmScore >= settings.confidenceLlmYesThreshold ? 'YES' : 'NO',
      message: grounded ? undefined : 'Немає релевантної відповіді',
    };
  }

  private async llmRelevanceScore(answer: string, context: string): Promise<number> {
    const trimmedContext = this.trimForEmbedding(context);

    const systemPrompt = `
      You are a semantic relevance scorer for a RAG system.

      Your task:
      Return a number between 0 and 1 representing how semantically related
      the ANSWER is to the CONTEXT.

      0 = completely unrelated topic
      0.5 = partially related / weak topical overlap
      1 = clearly about the same topic

      Be tolerant to paraphrasing.
      Do not require exact wording overlap.
      Return ONLY a number between 0 and 1.
    `;

    const userPrompt = `
      CONTEXT:
      ${trimmedContext}

      ANSWER:
      ${answer}

      Relevance score:
    `;

    try {
      const raw = await this.chatPort.complete(`${systemPrompt}\n\n${userPrompt}`);
      const parsed = parseFloat(raw.trim().replace(',', '.'));
      if (isNaN(parsed)) return 0;
      return Math.max(0, Math.min(1, parsed));
    } catch {
      return 0;
    }
  }

  private async safeEmbed(text: string): Promise<number[] | null> {
    try {
      const trimmed = this.trimForEmbedding(text);
      return await this.embeddingPort.embed(trimmed);
    } catch {
      return null;
    }
  }

  private trimForEmbedding(text: string): string {
    if (!text) return '';
    return text.length > this.MAX_EMBED_CHARS ? text.slice(0, this.MAX_EMBED_CHARS) : text;
  }

  private scoreTier(score: number, t: ConfidenceThresholds): ConfidenceTier {
    if (score >= t.high) return 'HIGH';
    if (score < t.low) return 'LOW';
    return 'GRAY_ZONE';
  }

  private resolveThresholds(override?: Partial<ConfidenceThresholds>): ConfidenceThresholds {
    const settings = this.ragSettings.get();
    return {
      high: override?.high ?? settings.confidenceHigh,
      low: override?.low ?? settings.confidenceLow,
    };
  }

  private filterChunksByKeywords(chunks: string[], question: string): string[] {
    const keywords = question.toLowerCase().match(/\w+/g) || [];
    return chunks.filter((chunk) => keywords.some((k) => chunk.toLowerCase().includes(k)));
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
