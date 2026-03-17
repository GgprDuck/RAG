import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IImageDocumentRepository } from '../../../domain/repositories/image-document.repository';
import { ImageDocument } from '../../../domain/entities/image-document.entity';
import { Embedding } from '../../../domain/value-objects/embedding.vo';
import { CollectionConfig } from '../../../domain/value-objects/collection-config.vo';
import { RagQdrantService } from '../rag-qdrant.service';
import { RAG_CONFIG, TRagConfig } from '../../config/rag-config';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { ImageDocumentQdrantMapper } from '../../mappers/image-document.qdrant.mapper';

@Injectable()
export class QdrantImageDocumentRepository
  implements IImageDocumentRepository, OnModuleInit
{
  private readonly collectionConfig: CollectionConfig;

  constructor(
    private readonly qdrant: RagQdrantService,
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {
    const ragConfig = this.configService.get<TRagConfig>(RAG_CONFIG);
    const vectorSize = ragConfig?.imageRagVectorSize || 768;
    const hnswConfig = ragConfig?.imageRagHnswConfig;

    this.collectionConfig = new CollectionConfig(
      ragConfig?.imageRagCollectionName || 'rag_images',
      vectorSize,
      'Cosine',
      hnswConfig
        ? {
            m: hnswConfig.m,
            efConstruct: hnswConfig.efConstruct,
            efSearch: hnswConfig.efSearch,
          }
        : undefined,
    );
  }

  async onModuleInit(): Promise<void> {
    await this.qdrant.ensureCollectionWithConfig(this.collectionConfig);
    this.logger.log(
      `Qdrant text collection "${this.collectionConfig.name}" is ready`,
    );
  }

  async save(document: ImageDocument): Promise<void> {
    await this.saveMany([document]);
  }

  async saveMany(documents: ImageDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const points = documents.map((doc) =>
      ImageDocumentQdrantMapper.toPoint(doc),
    );

    await this.qdrant.upsert(this.collectionConfig.name, points);
  }

  async findByEmbedding(
    embedding: Embedding,
    limit: number,
  ): Promise<Array<ImageDocument>> {
    const searchLimit = Math.max(limit, 100);

    const results = await this.qdrant.search(this.collectionConfig.name, {
      vector: embedding.values,
      limit: searchLimit,
      params: {
        hnsw_ef: this.collectionConfig.hnswConfig?.efSearch || 64,
      },
    });

    return results
      .slice(0, limit)
      .map((result) =>
        ImageDocumentQdrantMapper.fromPoint(result, result.score),
      );
  }

  async findAll(limit = 1000): Promise<Array<ImageDocument>> {
    const results = await this.qdrant.scroll(this.collectionConfig.name, {
      limit,
    });
    return (results.points || []).map((point) =>
      ImageDocumentQdrantMapper.fromPoint(point),
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.qdrant.deletePoints(this.collectionConfig.name, [id]);
  }

  async findById(id: string): Promise<ImageDocument | null> {
    try {
      const results = await this.qdrant.scroll(this.collectionConfig.name, {
        filter: {
          must: [{ key: 'id', match: { value: id } }],
        },
        limit: 1,
      });

      if (!results.points || results.points.length === 0) {
        return null;
      }

      return ImageDocumentQdrantMapper.fromPoint(results.points[0]);
    } catch (err) {
      this.logger.error('Failed to find image by ID:', err);
      return null;
    }
  }
}
