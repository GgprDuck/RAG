import { IChatLlmPort } from "../../domain/ports/chat-llm.port";
import type { TextVectorSearchMode as SearchMode } from "../../domain/ports/text-vector-search.port";
export type QueryType = 'entity' | 'factual' | 'wide';
export interface QueryClassification {
    type: QueryType;
    confidence: number;
    params: FineTuningParams;
}
export interface FineTuningParams {
    limit: number;
    scoreThreshold: number;
    searchMode: SearchMode | 'entity';
    useHybridSearch: boolean;
    useQueryTransformation: boolean;
    useReranking: boolean;
    rerankStrategy: 'listwise_llm' | 'llm_based' | 'none' | 'hybrid';
    useContextualCompression: boolean;
    useParentExpansion: boolean;
    useKnowledgeGraph: boolean;
    useConversationMemory: boolean;
    useCitationTracking: boolean;
    temperature: number;
    topP: number | undefined;
    topK: number | undefined;
    maxTokens: number;
    repeatPenalty: number | undefined;
    seed: number | undefined;
}
export declare class QueryClassifier {
    private readonly chatLlm;
    constructor(chatLlm: IChatLlmPort);
    classify(query: string): Promise<QueryClassification>;
    private build;
    private default;
}
