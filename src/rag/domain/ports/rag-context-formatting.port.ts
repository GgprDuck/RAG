import type { IDocumentWithEmbedding } from '../interfaces/rag-document-readmodels.interface';

export interface IRagContextFormattingPort {
  formatRetrievedDocuments(
    docs: IDocumentWithEmbedding[],
  ): Promise<string>;
}
