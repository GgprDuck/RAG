import { OllamaService } from '../../infrastructure/ollama/ollama.service';
export interface ChunkMetadata {
    chunkId: string;
    parentId?: string;
    childIds?: string[];
    level: number;
    startIndex: number;
    endIndex: number;
    headers?: string[];
    parentText?: string;
    sectionHeader?: string;
}
export interface SemanticChunk {
    text: string;
    metadata: ChunkMetadata;
}
export declare function splitIntoSentences(text: string): string[];
export declare function semanticChunking(text: string, ollamaService: OllamaService, options?: {
    minChunkSize?: number;
    maxChunkSize?: number;
    similarityThreshold?: number;
}): Promise<SemanticChunk[]>;
export interface ParentChildOptions {
    parentSize?: number;
    childSize?: number;
    overlap?: number;
    fileId?: string;
    storeParentText?: boolean;
    useMarkdownHeaders?: boolean;
}
export declare function parentChildChunking(text: string, onChunk: (chunk: SemanticChunk) => Promise<void>, options?: ParentChildOptions): Promise<void>;
