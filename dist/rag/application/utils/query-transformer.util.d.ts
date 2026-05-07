import { IChatLlmPort } from "../../domain/ports/chat-llm.port";
import { Redis } from "@upstash/redis";
export interface TransformedQuery {
    original: string;
    expanded: string[];
    rephrased: string[];
    keywords: string[];
    isEntityQuery: boolean;
}
export declare function translateQueryToUkrainian(query: string): string[];
export declare class QueryTransformer {
    private readonly chatLlm;
    private readonly redis?;
    constructor(chatLlm: IChatLlmPort, redis?: Redis | undefined);
    transformQuery(query: string, isEntityOverride?: boolean): Promise<TransformedQuery>;
    private expandQuery;
    private rephraseQuery;
    private extractKeywords;
}
