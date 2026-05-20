import { ConfidenceThresholds, ConfidenceScore, VerificationResult } from "../../domain/interfaces/confidence.interface";
import { IConfidencePort } from "../../domain/ports/confidence.port";
import type { IRagSettingsPort } from "../../domain/ports/rag-settings.port";
import { LoggerPort } from "../../shared/application/ports/logger.port";
interface IEmbeddingPort {
    embed(text: string): Promise<number[]>;
}
interface IChatLlmPort {
    complete(prompt: string): Promise<string>;
}
export declare class ConfidenceService implements IConfidencePort {
    private readonly embeddingPort;
    private readonly chatPort;
    private readonly ragSettings;
    private readonly logger;
    private readonly MAX_EMBED_CHARS;
    private readonly MAX_CHUNKS_TO_COMPARE;
    constructor(embeddingPort: IEmbeddingPort, chatPort: IChatLlmPort, ragSettings: IRagSettingsPort, logger: LoggerPort);
    computeScore(answer: string, retrievedChunks: string[], thresholds?: Partial<ConfidenceThresholds>): Promise<ConfidenceScore>;
    verify(answer: string, retrievedChunks: string[], thresholds?: Partial<ConfidenceThresholds>): Promise<VerificationResult>;
    private llmRelevanceScore;
    private safeEmbed;
    private trimForEmbedding;
    private scoreTier;
    private resolveThresholds;
    private filterChunksByKeywords;
}
export {};
