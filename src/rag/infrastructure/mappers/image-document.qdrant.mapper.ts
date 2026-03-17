import { Schemas } from '@qdrant/js-client-rest';
import { ImageDocument } from 'src/rag/domain/entities/image-document.entity';
import { Embedding } from 'src/rag/domain/value-objects/embedding.vo';
import { SimilarityScore } from 'src/rag/domain/value-objects/similarity-score.vo';

export class ImageDocumentQdrantMapper {
  static toPoint(doc: ImageDocument) {
    return {
      id: doc.id,
      vector: doc.embedding.values,
      payload: {
        s3Url: doc.s3Url,
        s3Key: doc.s3Key,
        mimeType: doc.mimeType,
        description: doc.description,
        keywords: doc.keywords,
        createdAt: doc.createdAt.toISOString(),
        model: doc.model,
      },
    };
  }

  static fromPoint(
    point: Schemas['ScoredPoint'] | Schemas['Record'],
    score?: number,
  ): ImageDocument {
    const createdAt = point.payload?.createdAt
      ? new Date(String(point.payload.createdAt))
      : new Date();

    const doc = new ImageDocument(
      String(point.id),
      String(point.payload?.s3Url ?? ''),
      String(point.payload?.s3Key ?? ''),
      String(point.payload?.mimeType ?? 'image/png'),
      String(point.payload?.description ?? ''),
      Array.isArray(point.payload?.keywords)
        ? point.payload.keywords.map(String)
        : [],
      new Embedding((point.vector as number[]) ?? []),
      createdAt,
      String(point.payload?.model ?? 'unknown'),
    );

    return score !== undefined
      ? new ImageDocument(
          doc.id,
          doc.s3Url,
          doc.s3Key,
          doc.mimeType,
          doc.description,
          doc.keywords,
          doc.embedding,
          doc.createdAt,
          doc.model,
          new SimilarityScore(score),
        )
      : doc;
  }
}
