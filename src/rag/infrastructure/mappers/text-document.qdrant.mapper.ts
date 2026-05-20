import { Schemas } from '@qdrant/js-client-rest';
import { TextDocument } from 'src/rag/domain/entities/text-document.entity';
import { Embedding } from 'src/rag/domain/value-objects/embedding.vo';

export class TextDocumentQdrantMapper {
  static toPoint(doc: TextDocument) {
    return {
      id: doc.id,
      vector: doc.embedding.values,
      payload: {
        text: doc.text,
        createdAt: doc.createdAt.toISOString(),
        model: doc.model,
        chunkId: doc.chunkId,
        level: doc.level,
        startIndex: doc.startIndex,
        endIndex: doc.endIndex,
        childIds: doc.childIds,
        parentId: doc.parentId,
        parentText: doc.parentText,
        contextKeywords: doc.contextKeywords,
        sectionTitle: doc.sectionTitle,
      },
    };
  }

  static fromPoint(
    point: Schemas['ScoredPoint'] | Schemas['Record'],
    model?: string,
  ): TextDocument {
    const createdAt = point.payload?.createdAt
      ? new Date(String(point.payload.createdAt))
      : new Date();
    
    const resolvedModel =
      model ?? String(point.payload?.model ?? 'unknown');

    const payload = point.payload as Record<string, any> | null | undefined;
    
    return new TextDocument(
      String(point.id),
      String(payload?.text ?? ''),
      new Embedding((point.vector as number[]) ?? []),
      resolvedModel,
      createdAt,
      payload?.chunkId    ? String(payload.chunkId)    : undefined,
      payload?.level      != null ? Number(payload.level) : undefined,
      payload?.startIndex != null ? Number(payload.startIndex) : undefined,
      payload?.endIndex   != null ? Number(payload.endIndex)   : undefined,
      Array.isArray(payload?.childIds) ? payload.childIds as string[] : undefined,
      payload?.parentId   ? String(payload.parentId)   : undefined,
      payload?.parentText ? String(payload.parentText)  : undefined,
      Array.isArray(payload?.contextKeywords) ? payload.contextKeywords as string[] : undefined,
      payload?.sectionTitle ? String(payload.sectionTitle) : undefined,
    );
  }
}