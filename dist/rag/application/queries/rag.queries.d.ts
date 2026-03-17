export declare class GetAllDocumentsQuery {
}
export declare class GetAllImagesQuery {
    readonly limit?: number | undefined;
    constructor(limit?: number | undefined);
}
export declare class GetImagesByKeywordQuery {
    readonly query: string;
    readonly limit?: number | undefined;
    constructor(query: string, limit?: number | undefined);
}
export declare class RetrieveDocumentsQuery {
    readonly query: string;
    readonly limit?: number | undefined;
    readonly options?: {
        useHybridSearch?: boolean;
        useReranking?: boolean;
        rerankStrategy?: "cross_encoder" | "llm_based" | "none";
        useQueryTransformation?: boolean;
        useContextualCompression?: boolean;
        scoreThreshold?: number;
        filters?: Array<{
            field: string;
            value: unknown;
            operator?: string;
        }>;
    } | undefined;
    constructor(query: string, limit?: number | undefined, options?: {
        useHybridSearch?: boolean;
        useReranking?: boolean;
        rerankStrategy?: "cross_encoder" | "llm_based" | "none";
        useQueryTransformation?: boolean;
        useContextualCompression?: boolean;
        scoreThreshold?: number;
        filters?: Array<{
            field: string;
            value: unknown;
            operator?: string;
        }>;
    } | undefined);
}
