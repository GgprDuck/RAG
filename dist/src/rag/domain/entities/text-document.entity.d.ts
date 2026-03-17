import { Embedding } from '../value-objects/embedding.vo';
export declare class TextDocument {
    readonly id: string;
    readonly text: string;
    readonly embedding: Embedding;
    readonly model: string;
    readonly createdAt: Date;
    readonly chunkId?: string | undefined;
    readonly level?: number | undefined;
    readonly startIndex?: number | undefined;
    readonly endIndex?: number | undefined;
    readonly childIds?: string[] | undefined;
    readonly parentId?: string | undefined;
    readonly parentText?: string | undefined;
    readonly contextKeywords?: string[] | undefined;
    readonly score?: number | undefined;
    constructor(id: string, text: string, embedding: Embedding, model: string, createdAt: Date, chunkId?: string | undefined, level?: number | undefined, startIndex?: number | undefined, endIndex?: number | undefined, childIds?: string[] | undefined, parentId?: string | undefined, parentText?: string | undefined, contextKeywords?: string[] | undefined, score?: number | undefined);
    static create(id: string, text: string, embedding: number[], model: string, createdAt: Date, chunkId?: string, level?: number, startIndex?: number, endIndex?: number, childIds?: string[], parentId?: string, parentText?: string, contextKeywords?: string[], score?: number): TextDocument;
}
