import { Injectable } from '@nestjs/common';
import {
  ITextVectorSearchPort,
  PointRecord,
  ScoredVectorHit,
  ScrollHit,
  ScrollQuery,
  VectorSearchQuery,
} from 'src/rag/domain/ports/text-vector-search.port';
import { RagQdrantService } from './rag-qdrant.service';

@Injectable()
export class QdrantVectorSearchAdapter implements ITextVectorSearchPort {
  constructor(private readonly qdrant: RagQdrantService) {}

  async search(
    collectionName: string,
    query: VectorSearchQuery,
  ): Promise<ScoredVectorHit[]> {
    const raw = await this.qdrant.search(collectionName, {
      vector: query.vector,
      limit: query.limit,
      filter: query.filter,
      score_threshold: query.score_threshold,
      searchMode: query.searchMode,
      with_vector: query.with_vector,
      params: query.params,
    });
    return raw.map((r) => ({
      id: r.id.toString(),
      score: r.score ?? 0,
      payload: (r.payload ?? {}) as Record<string, unknown>,
      vector: Array.isArray(r.vector) ? (r.vector as number[]) : undefined,
    }));
  }

  async scroll(
    collectionName: string,
    query: ScrollQuery,
  ): Promise<{ points: ScrollHit[] }> {
    const res = await this.qdrant.scroll(collectionName, {
      limit: query.limit,
      offset: query.offset,
      filter: query.filter,
      with_payload: query.with_payload,
    });
    const points: ScrollHit[] = (res.points ?? []).map((p) => ({
      id: p.id.toString(),
      payload: (p.payload ?? {}) as Record<string, unknown>,
    }));
    return { points };
  }

  async getPoints(
    collectionName: string,
    ids: (string | number)[],
  ): Promise<PointRecord[]> {
    const records = await this.qdrant.getPoints(collectionName, ids);
    return records.map((r) => ({
      id: String(r.id),
      payload: (r.payload ?? {}) as Record<string, unknown>,
    }));
  }
}
