export declare enum RerankStrategy {
    NONE = "none",
    CROSS_ENCODER = "cross_encoder",
    LLM_BASED = "llm_based"
}
export declare class ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare class MetadataFilter {
    field: string;
    value: unknown;
    operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
}
export declare class AdvancedRagOptionsDto {
    useHybridSearch?: boolean;
    useReranking?: boolean;
    rerankStrategy?: RerankStrategy;
    useQueryTransformation?: boolean;
    useContextualCompression?: boolean;
    useConversationMemory?: boolean;
    useCitationTracking?: boolean;
    includeRetrievalDiagnostics?: boolean;
    useAnswerCache?: boolean;
    useKnowledgeGraph?: boolean;
    sessionId?: string;
}
export declare class AskDto {
    readonly question: string;
    readonly limit?: number;
    readonly scoreThreshold?: number;
    readonly temperature?: number;
    readonly topP?: number;
    readonly topK?: number;
    readonly conversationHistory?: ConversationMessage[];
    readonly filters?: MetadataFilter[];
    readonly rerankStrategy?: RerankStrategy;
    readonly includeSources?: boolean;
    readonly maxTokens?: number;
    readonly options?: AdvancedRagOptionsDto;
}
