import { IUploadedFile } from 'src/rag/domain/interfaces/upload-folder.interface';

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

export class UploadFolderCommand {
  constructor(
    public readonly files: IUploadedFile[],
    public readonly options?: UploadFolderOptions,
  ) {}
}