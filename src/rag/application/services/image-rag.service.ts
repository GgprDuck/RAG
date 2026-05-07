import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IImageDocumentRepository } from '../../domain/repositories/image-document.repository';
import { ImageDocument } from '../../domain/entities/image-document.entity';
import { Embedding } from '../../domain/value-objects/embedding.vo';
import { SimilarityScore } from '../../domain/value-objects/similarity-score.vo';
import { extractEmbedding } from '../utils/embedding.util';
import { levenshteinDistance, parseQueryWithNegation } from '../utils/text-query.util';
import type { IRagSettingsPort } from 'src/rag/domain/ports/rag-settings.port';
import { IUploadedFile } from 'src/rag/domain/interfaces/upload-folder.interface';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { IUploadImage, IDeleteImage, IImageWithScore, IImageWithoutScore } from '../common/interfaces/image.interfaces';
import { IStoragePort } from 'src/rag/domain/ports/storage.port';
import { IChatLlmPort } from 'src/rag/domain/ports/chat-llm.port';
import { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';
import { ImageRagPort } from 'src/rag/domain/ports/image-rag.port';


@Injectable()
export class ImageRagService implements ImageRagPort {
  constructor(
    @Inject('IRagSettingsPort') private readonly ragSettings: IRagSettingsPort,
    @Inject('IEmbeddingPort') private readonly embeddingPort: IEmbeddingPort,
    @Inject('IChatLlmPort') private readonly chatLlm: IChatLlmPort,
    @Inject('IStoragePort') private readonly storage: IStoragePort,
    @Inject('IImageDocumentRepository')
    private readonly imageRepository: IImageDocumentRepository,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async uploadImages(files: IUploadedFile[]): Promise<IUploadImage> {
    const { ollamaEmbedModelText: embedModel } = this.ragSettings.get();
    const createdAt = new Date();

    const documents = await Promise.all(
      files.map(async (file) => {
        const id = uuidv4();
        const s3Key = `images/${id}/${file.originalname || 'image'}`;

        const [s3Url, description] = await Promise.all([
          this.storage.uploadFile(s3Key, file.buffer, file.mimetype),
          this.chatLlm.describeImage(file.buffer, file.mimetype),
        ]);

        const [embeddingRaw, keywords] = await Promise.all([
          this.embeddingPort.embed(description),
          this.chatLlm.extractKeywords(description),
        ]);

        const embedding = extractEmbedding(embeddingRaw);
        if (!embedding) throw new Error(`Failed to embed image description for ${file.originalname}`);

        return ImageDocument.create(
          id,
          s3Url,
          s3Key,
          file.mimetype,
          description,
          keywords,
          embedding,
          embedModel,
          createdAt,
        );
      }),
    );

    await this.imageRepository.saveMany(documents);
    return { imagesUploaded: documents.length };
  }

  async deleteImageById(id: string): Promise<IDeleteImage> {
    const document = await this.imageRepository.findById(id);
    if (document) {
      await this.storage.deleteFile(document.s3Key);
    }
    await this.imageRepository.deleteById(id);
    return { deletedImageId: id };
  }

  async getImagesByKeyword(query: string, limit = 10): Promise<Array<IImageWithScore>> {
    const { imageRagMinScoreThreshold } = this.ragSettings.get();
    const minScore = new SimilarityScore(imageRagMinScoreThreshold);

    const embeddingRaw = await this.embeddingPort.embed(query);
    const embedding = extractEmbedding(embeddingRaw);
    if (!embedding) return [];
    const queryEmbedding = new Embedding(embedding);

    let documents: Array<ImageDocument> = [];
    try {
      documents = await this.imageRepository.findByEmbedding(
        queryEmbedding,
        Math.max(limit, 100),
        minScore,
      );
    } catch (err) {
      this.logger.error('Failed to query Qdrant for images', { err });
      throw new InternalServerErrorException('Image search failed. Please try again later.');
    }

    const { include, exclude } = parseQueryWithNegation(query);

    documents = documents.map((doc) => {
      const kws = doc.keywords.map((k) => k.toLowerCase());
      let score = doc.score?.value ?? 0;

      if (exclude.length > 0) {
        score = exclude.some((e) => kws.includes(e.toLowerCase()))
          ? Math.max(0, score - 0.2)
          : Math.min(1, score + 0.2);
      }

      for (const word of include) {
        for (const keyword of kws) {
          const dist = levenshteinDistance(keyword, word.toLowerCase());
          if (keyword.includes(word.toLowerCase()) || dist <= 1) {
            score = score + 0.2;
            break;
          }
        }
      }

      return doc.withScore(score);
    });

    documents.sort((a, b) => (b.score?.value ?? 0) - (a.score?.value ?? 0));
    documents = documents
      .filter((doc) => (doc.score?.value ?? 0) >= minScore.value)
      .slice(0, limit);

    return documents.map((doc) => ({
      id: doc.id,
      s3Url: doc.s3Url,
      s3Key: doc.s3Key,
      mimeType: doc.mimeType,
      description: doc.description,
      embedding: doc.embedding.values,
      keywords: doc.keywords,
      score: doc.score?.value ?? 0,
      createdAt: doc.createdAt.toISOString(),
      model: doc.model,
    }));
  }

  async getAllImages(limit = 1000): Promise<Array<IImageWithoutScore>> {
    const documents = await this.imageRepository.findAll(limit);
    return documents.map((doc) => ({
      id: doc.id,
      s3Url: doc.s3Url,
      mimeType: doc.mimeType,
      description: doc.description,
      keywords: doc.keywords,
      embedding: doc.embedding.values,
      createdAt: doc.createdAt.toISOString(),
      model: doc.model,
    }));
  }
}
