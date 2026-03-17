import { OllamaService } from '../../infrastructure/ollama/ollama.service';
export interface CompressedContext {
    original: string;
    compressed: string;
    relevantSentences: string[];
    compressionRatio: number;
}
export declare class ContextualCompressor {
    private readonly ollamaService;
    constructor(ollamaService: OllamaService);
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
