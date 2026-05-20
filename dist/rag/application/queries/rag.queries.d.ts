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
import { AskQuestionOptions } from "../../domain/interfaces/ask-question.interface";
export declare class RetrieveDocumentsQuery {
    readonly query: string;
    readonly limit?: number | undefined;
    readonly options?: Pick<AskQuestionOptions, "useHybridSearch" | "useReranking" | "rerankStrategy" | "useQueryTransformation" | "useContextualCompression" | "scoreThreshold" | "filters"> | undefined;
    constructor(query: string, limit?: number | undefined, options?: Pick<AskQuestionOptions, "useHybridSearch" | "useReranking" | "rerankStrategy" | "useQueryTransformation" | "useContextualCompression" | "scoreThreshold" | "filters"> | undefined);
}
