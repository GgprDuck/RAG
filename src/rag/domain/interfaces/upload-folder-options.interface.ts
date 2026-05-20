export interface UploadFolderOptions {
  chunkingStrategy?: 'simple' | 'semantic' | 'parent-child';
  enableKnowledgeGraph?: boolean;
  parentChild?: {
    parentSize?: number;
    childSize?: number;
    overlap?: number;
    storeParentText?: boolean;
    useMarkdownHeaders?: boolean;
  };
}
