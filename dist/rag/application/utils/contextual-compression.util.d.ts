import { IChatLlmPort } from "../../domain/ports/chat-llm.port";
import { IEmbeddingPort } from "../../domain/ports/embedding.port";
export interface CompressedContext {
    original: string;
    compressed: string;
    relevantSentences: string[];
    compressionRatio: number;
}
export declare class ContextualCompressor {
    private readonly embedding;
    private readonly chatLlm;
    constructor(embedding: IEmbeddingPort, chatLlm: IChatLlmPort);
    compressContext(query: string, documents: Array<{
        id: string;
        text: string;
    }>, options?: {
        maxTokens?: number;
        method?: 'extractive' | 'abstractive' | 'hybrid';
    }): Promise<CompressedContext[]>;
    private compressSingleDocument;
    private extractiveCompression;
    private abstractiveCompression;
    private hybridCompression;
    private cosineSimilarity;
}
