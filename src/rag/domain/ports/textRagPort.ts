import {
  IDeleteDocument,
  IGenerateAnswer,
  IStreamChunk,
  IUploadKnowledge,
} from '../interfaces/rag-answer.interface';
import type {
  IDocumentWithEmbedding,
  IDocumentWithoutEmbedding,
} from '../interfaces/rag-document-readmodels.interface';
import { AskQuestionOptions } from '../interfaces/ask-question.interface';
import { IUploadedFile } from '../interfaces/upload-folder.interface';
import { UploadFolderOptions } from '../interfaces/upload-folder-options.interface';

export interface TextRagUploadFile {
  originalname: string;
  buffer: Buffer;
  mimetype?: string;
}

export interface TextRagPort {
  uploadKnowledgeFromFile(
    file: TextRagUploadFile,
    options?: {
      chunkingStrategy?: 'simple' | 'semantic' | 'parent-child';
      enableKnowledgeGraph?: boolean;
    },
  ): Promise<IUploadKnowledge>;

  retrieve(
    query: string,
    limit?: number,
    options?: Pick<
      AskQuestionOptions,
      | 'useHybridSearch'
      | 'useReranking'
      | 'rerankStrategy'
      | 'useQueryTransformation'
      | 'useContextualCompression'
      | 'useConversationMemory'
      | 'sessionId'
      | 'scoreThreshold'
      | 'filters'
    >,
  ): Promise<Array<IDocumentWithEmbedding> | string>;

  getAllDocuments(): Promise<Array<IDocumentWithoutEmbedding>>;

  generateAnswer(
    question: string,
    options?: AskQuestionOptions,
  ): Promise<IGenerateAnswer | string>;

  streamableGenerateAnswer(
    question: string,
    options?: AskQuestionOptions,
  ): AsyncGenerator<IStreamChunk>;

  deleteById(id: string): Promise<IDeleteDocument>;

  uploadMarkdownFolder(
    files: IUploadedFile[],
    options: UploadFolderOptions | undefined,
  ): Promise<{ totalChunks: number; filesProcessed: number }>;
}
