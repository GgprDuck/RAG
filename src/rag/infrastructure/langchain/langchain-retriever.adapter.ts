import { Inject, Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { RunnableLambda, RunnableSequence } from '@langchain/core/runnables';
import type { IDocumentWithEmbedding } from 'src/rag/domain/interfaces/rag-document-readmodels.interface';
import type { IRagContextFormattingPort } from 'src/rag/domain/ports/rag-context-formatting.port';
import type { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';
import type { ITextVectorSearchPort } from 'src/rag/domain/ports/text-vector-search.port';
import type { IRagSettingsPort } from 'src/rag/domain/ports/rag-settings.port';
import type { TextVectorSearchMode } from 'src/rag/domain/ports/text-vector-search.port';
import { VectorSearchBackedRetriever } from './langchain-vector-retriever';

@Injectable()
export class LangChainRetrieverAdapter implements IRagContextFormattingPort {
  constructor(
    @Inject('IEmbeddingPort') private readonly embedding: IEmbeddingPort,
    @Inject('ITextVectorSearchPort')
    private readonly vectorSearch: ITextVectorSearchPort,
    @Inject('IRagSettingsPort') private readonly ragSettings: IRagSettingsPort,
  ) {}

  toDocuments(docs: IDocumentWithEmbedding[]): Document[] {
    return docs.map(
      (doc) =>
        new Document({
          pageContent: doc.text,
          metadata: {
            id: doc.id,
            score: doc.score,
            ...(doc.metadata as Record<string, unknown> | undefined),
          },
        }),
    );
  }

  toContext(docs: Document[]): string {
    return docs
      .map((doc) => doc.pageContent)
      .filter(Boolean)
      .join('\n\n');
  }

  async formatRetrievedDocuments(
    docs: IDocumentWithEmbedding[],
  ): Promise<string> {
    const toDocs = new RunnableLambda({
      func: (d: IDocumentWithEmbedding[]) => this.toDocuments(d),
    }).withConfig({ runName: 'toLangChainDocuments' });

    const toString = new RunnableLambda({
      func: (lcDocs: Document[]) => this.toContext(lcDocs),
    }).withConfig({ runName: 'joinPageContent' });

    const chain = RunnableSequence.from([toDocs, toString]);
    return chain.invoke(docs);
  }

  createSimpleVectorRetriever(
    k: number,
    searchMode: TextVectorSearchMode = 'balanced',
  ): VectorSearchBackedRetriever {
    const { textRagCollectionName } = this.ragSettings.get();
    return new VectorSearchBackedRetriever(
      this.embedding,
      this.vectorSearch,
      textRagCollectionName,
      k,
      searchMode,
    );
  }
}
