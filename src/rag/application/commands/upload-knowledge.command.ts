import { IUploadedFile } from "src/rag/domain/interfaces/upload-folder.interface";

export interface UploadKnowledgeOptions {
  chunkingStrategy?: 'simple' | 'semantic' | 'parent-child';
  enableKnowledgeGraph?: boolean;
}

export class UploadKnowledgeCommand {
  constructor(
    public readonly file: IUploadedFile,
    public readonly options?: UploadKnowledgeOptions,
  ) {}
}
