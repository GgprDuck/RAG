import { Embedding } from '../value-objects/embedding.vo';
import { SimilarityScore } from '../value-objects/similarity-score.vo';

export class ImageDocument {
  constructor(
    public readonly id: string,
    public readonly s3Url: string,
    public readonly s3Key: string,
    public readonly mimeType: string,
    public readonly description: string,
    public readonly keywords: string[],
    public readonly embedding: Embedding,
    public readonly createdAt: Date,
    public readonly model: string,
    public readonly score?: SimilarityScore,
  ) {
    if (!description || description.trim().length === 0) {
      throw new Error('Image description cannot be empty');
    }
    if (!Array.isArray(keywords)) {
      throw new Error('Keywords must be an array');
    }
    if (!s3Url || s3Url.trim().length === 0) {
      throw new Error('S3 URL cannot be empty');
    }
    if (!s3Key || s3Key.trim().length === 0) {
      throw new Error('S3 key cannot be empty');
    }
    if (!model || model.trim().length === 0) {
      throw new Error('Model cannot be empty');
    }
  }

  static create(
    id: string,
    s3Url: string,
    s3Key: string,
    mimeType: string,
    description: string,
    keywords: string[],
    embedding: number[],
    model: string,
    createdAt?: Date,
  ): ImageDocument {
    return new ImageDocument(
      id,
      s3Url,
      s3Key,
      mimeType,
      description,
      keywords,
      new Embedding(embedding),
      createdAt || new Date(),
      model,
    );
  }

  withScore(score: number): ImageDocument {
    return new ImageDocument(
      this.id,
      this.s3Url,
      this.s3Key,
      this.mimeType,
      this.description,
      this.keywords,
      this.embedding,
      this.createdAt,
      this.model,
      new SimilarityScore(score),
    );
  }
}
