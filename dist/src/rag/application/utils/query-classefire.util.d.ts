import { OllamaService } from '../../infrastructure/ollama/ollama.service';
import { SearchMode } from '../../infrastructure/qdrant/rag-qdrant.service';
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
    rerankStrategy: 'cross_encoder' | 'llm_based' | 'none' | 'hybrid';
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
    private readonly ollama;
    constructor(ollama: OllamaService);
    classify(query: string): Promise<QueryClassification>;
    private build;
    private default;
}
