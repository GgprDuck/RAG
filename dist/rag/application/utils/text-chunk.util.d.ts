export type ChunkOptions = {
    minWords?: number;
    maxWords?: number;
    overlap?: number;
    preserveParagraphs?: boolean;
};
export interface Chunk {
    text: string;
    startIndex: number;
    endIndex: number;
    metadata?: Record<string, any>;
}
export declare function advancedChunkText(text: string, { minWords, maxWords, overlap, preserveParagraphs, }?: ChunkOptions): Chunk[];
export declare function chunkTextBySentences(text: string, { minWords, maxWords }?: ChunkOptions): string[];
