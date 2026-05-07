export interface IDocumentWithEmbedding {
  id: string;
  text: string;
  embedding: number[];
  createdAt: string;
  model: string;
  score?: number;
  metadata?: Record<string, unknown>;
  parentId?: string;
  parentText?: string;
}

export interface IDocumentWithoutEmbedding {
  id: string;
  text: string;
  createdAt: string;
  model: string;
  metadata?: Record<string, unknown>;
}
