export type TextVectorSearchMode = 'precise' | 'wide' | 'balanced';

export interface VectorSearchQuery {
  vector: number[];
  limit: number;
  filter?: unknown;
  score_threshold?: number | null;
  searchMode?: TextVectorSearchMode;
  with_vector?: boolean;
  params?: Record<string, unknown>;
}

export interface ScoredVectorHit {
  id: string;
  score: number;
  payload: Record<string, unknown>;
  vector?: number[];
}

export interface ScrollQuery {
  limit: number;
  offset?: string | number;
  filter?: unknown;
  with_payload?: boolean;
}

export interface ScrollHit {
  id: string;
  payload: Record<string, unknown>;
}

export interface PointRecord {
  id: string;
  payload: Record<string, unknown>;
}

export interface ITextVectorSearchPort {
  search(
    collectionName: string,
    query: VectorSearchQuery,
  ): Promise<ScoredVectorHit[]>;

  scroll(
    collectionName: string,
    query: ScrollQuery,
  ): Promise<{ points: ScrollHit[] }>;

  getPoints(
    collectionName: string,
    ids: (string | number)[],
  ): Promise<PointRecord[]>;
}
