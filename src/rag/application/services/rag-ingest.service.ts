import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ITextDocumentRepository } from '../../domain/repositories/text-document.repository';
import { TextDocument } from '../../domain/entities/text-document.entity';
import { extractEmbedding } from '../utils/embedding.util';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';
import type { IRagSettingsPort } from 'src/rag/domain/ports/rag-settings.port';

/**
 * Document ingest helpers (embedding + persistence).
 */
@Injectable()
export class RagIngestService {
  constructor(
    @Inject('ITextDocumentRepository')
    private readonly textRepository: ITextDocumentRepository,
    @Inject('IRagSettingsPort')
    private readonly ragSettings: IRagSettingsPort,
    @Inject('LoggerPort')
    private readonly logger: LoggerPort,
    @Inject('IEmbeddingPort')
    private readonly embeddingPort: IEmbeddingPort,
  ) {}

  async embedAndSaveChunks(
    chunks: string[],
    embedModel: string,
    batchSize = 100,
    keywords: string[] = [],
    chunkMeta: Array<{ keywords?: string[]; sectionTitle?: string }> = [],
  ): Promise<number> {
    let saved = 0;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
      const embeddings = await Promise.all(
        batch.map((c) => this.embeddingPort.embed(c)),
      );
      const batchDocs = batch.map((chunk, idx) => {
        const globalIdx = i + idx;
        const meta = chunkMeta[globalIdx];
        const chunkKeywords = meta?.keywords?.length
          ? meta.keywords
          : keywords.length > 0
            ? keywords
            : undefined;
        return TextDocument.create(
          uuidv4(),
          chunk,
          extractEmbedding(embeddings[idx]),
          embedModel,
          new Date(),
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          chunkKeywords,
          meta?.sectionTitle,
        );
      });
      await this.textRepository.saveMany(batchDocs);
      saved += batchDocs.length;
    }
    this.logger.log('RagIngest: saved chunks', { count: saved });
    return saved;
  }
}
