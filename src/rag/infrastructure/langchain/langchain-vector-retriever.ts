import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import type { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';
import type {
  ITextVectorSearchPort,
  TextVectorSearchMode,
} from 'src/rag/domain/ports/text-vector-search.port';

export class VectorSearchBackedRetriever extends BaseRetriever {
  static lc_name() {
    return 'VectorSearchBackedRetriever';
  }

  lc_namespace = ['rag', 'retrievers'];

  constructor(
    private readonly embedding: IEmbeddingPort,
    private readonly vectorSearch: ITextVectorSearchPort,
    private readonly collectionName: string,
    private readonly k: number,
    private readonly searchMode: TextVectorSearchMode = 'balanced',
  ) {
    super({});
  }

  override async _getRelevantDocuments(query: string): Promise<Document[]> {
    const vector = await this.embedding.embed(query);
    if (!vector?.length) return [];

    const hits = await this.vectorSearch.search(this.collectionName, {
      vector,
      limit: this.k,
      score_threshold: null,
      searchMode: this.searchMode,
      with_vector: false,
    });

    return hits.map(
      (h) =>
        new Document({
          pageContent: String(h.payload.text ?? ''),
          metadata: {
            id: h.id,
            score: h.score,
            ...this.asRecord(h.payload),
          },
        }),
    );
  }

  private asRecord(payload: Record<string, unknown>): Record<string, unknown> {
    const { text: _t, ...rest } = payload;
    return rest;
  }
}
