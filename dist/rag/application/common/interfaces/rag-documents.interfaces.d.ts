export type { IDocumentWithEmbedding, IDocumentWithoutEmbedding, } from "../../../domain/interfaces/rag-document-readmodels.interface";
export interface ICitation {
    id: string;
    documentId: string;
    text: string;
}
export interface IGenerateAnswer {
    answer: string;
    formattedAnswer?: string;
    citations?: ICitation[];
    relevantChunks?: number;
    confidence?: number;
    queryType?: 'entity' | 'factual' | 'wide';
    queryConfidence?: number;
    generationParams?: {
        temperature: number;
        topP?: number;
        topK?: number;
        maxTokens: number;
        repeatPenalty?: number;
        seed?: number;
    };
    knowledgeGraphContext?: string;
    conversationContext?: boolean;
    sources?: Array<{
        id: string;
        text: string;
        score?: number;
        metadata?: Record<string, any>;
    }>;
    links?: Array<{
        url: string;
        label: string;
        linkType: string;
    }>;
    retrievalDiagnostics?: {
        effectiveLimit?: number;
        preFilterCount?: number;
        postFilterCount?: number;
        finalCount?: number;
        searchMode?: 'precise' | 'wide' | 'balanced' | 'entity';
        hybridEnabled?: boolean;
        rerankEnabled?: boolean;
        contextualCompressionEnabled?: boolean;
        cacheHit?: boolean;
    };
}
export interface IUploadKnowledge {
    chunks: number;
    metadata?: Record<string, any>;
}
export interface IDeleteDocument {
    deletedDocumentId: string;
}
export type IStreamChunk = {
    event: 'metadata';
    metadata: Partial<Omit<IGenerateAnswer, 'answer' | 'formattedAnswer' | 'sources' | 'links'>>;
} | {
    event: 'sources';
    sources: NonNullable<IGenerateAnswer['sources']>;
} | {
    event: 'links';
    links: NonNullable<IGenerateAnswer['links']>;
    block: string;
} | {
    event: 'token';
    token: string;
} | {
    event: 'citations';
    citations: ICitation[];
} | {
    event: 'correction';
    correctedAnswer: string;
    reason: 'hallucination';
} | {
    event: 'done';
    metadata: Partial<Omit<IGenerateAnswer, 'answer' | 'formattedAnswer' | 'sources'>>;
} | {
    event: 'error';
    error: string;
};
