import { RerankStrategy } from './ask.dto';
export declare class RetrieveOptionsDto {
    useHybridSearch?: boolean;
    useReranking?: boolean;
    rerankStrategy?: RerankStrategy;
    useQueryTransformation?: boolean;
    useContextualCompression?: boolean;
    scoreThreshold?: number;
    limit?: number;
}
export declare class RetrieveDto {
    query: string;
    options?: RetrieveOptionsDto;
}
