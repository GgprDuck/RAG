import { Embedding } from '../../domain/value-objects/embedding.vo';
import { LoggerPort } from '../../shared/application/ports/logger.port';
import type { ITextVectorSearchPort, TextVectorSearchMode } from "../../domain/ports/text-vector-search.port";
export type SearchMode = TextVectorSearchMode;
export interface HybridSearchResult {
    id: string;
    text: string;
    parentText?: string;
    parentId?: string;
    vectorScore: number;
    keywordScore: number;
    hybridScore: number;
    vector?: number[];
}
export declare class HybridSearchEngine {
    private readonly vectorSearch;
    private readonly logger?;
    constructor(vectorSearch: ITextVectorSearchPort, logger?: LoggerPort | undefined);
    search(collectionName: string, queryEmbedding: Embedding, keywords: string[], limit?: number, options?: {
        vectorWeight?: number;
        keywordWeight?: number;
        minKeywordMatch?: number;
        searchMode?: SearchMode | 'entity';
        scoreThreshold?: number;
        minTextLength?: number;
        originalQuery?: string;
        filter?: unknown;
    }): Promise<HybridSearchResult[] | null>;
}
