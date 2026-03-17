export interface AskQuestionOptions {
    question?: string;
    limit?: number;
    scoreThreshold?: number;
    useHybridSearch?: boolean;
    useQueryTransformation?: boolean;
    filters?: Array<{
        field: string;
        value: any;
        operator?: string;
    }>;
    useReranking?: boolean;
    rerankStrategy?: 'cross_encoder' | 'llm_based' | 'none' | 'hybrid';
    useContextualCompression?: boolean;
    useConversationMemory?: boolean;
    conversationHistory?: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
    topP?: number | undefined;
    topK?: number | undefined;
    sessionId?: string;
    useKnowledgeGraph?: boolean;
    useCitationTracking?: boolean;
    includeSources?: boolean;
    temperature?: number;
    maxTokens?: number;
}
