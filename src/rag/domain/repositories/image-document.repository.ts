import { ImageDocument } from '../entities/image-document.entity';
import { Embedding } from '../value-objects/embedding.vo';
import { SimilarityScore } from '../value-objects/similarity-score.vo';

export interface IImageDocumentRepository {
  save(document: ImageDocument): Promise<void>;
  saveMany(documents: ImageDocument[]): Promise<void>;
  findByEmbedding(
    embedding: Embedding,
    limit: number,
    minScore?: SimilarityScore,
  ): Promise<ImageDocument[]>;
  findAll(limit?: number): Promise<ImageDocument[]>;
  deleteById(id: string): Promise<void>;
  findById(id: string): Promise<ImageDocument | null>;
}
