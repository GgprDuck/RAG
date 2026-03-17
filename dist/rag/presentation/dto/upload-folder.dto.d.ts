export declare enum ChunkingStrategy {
    SIMPLE = "simple",
    SEMANTIC = "semantic",
    PARENT_CHILD = "parent-child"
}
export declare class UploadFolderDto {
    readonly chunkingStrategy?: 'simple' | 'semantic' | 'parent-child';
    readonly enableKnowledgeGraph?: string;
}
