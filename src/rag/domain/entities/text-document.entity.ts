import { Embedding } from '../value-objects/embedding.vo';

export class TextDocument {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly embedding: Embedding,
    public readonly model: string,
    public readonly createdAt: Date,
    public readonly chunkId?: string,
    public readonly level?: number,
    public readonly startIndex?: number,
    public readonly endIndex?: number,
    public readonly childIds?: string[],
    public readonly parentId?: string,
    public readonly parentText?: string,
    public readonly contextKeywords?: string[],
    public readonly score?: number,
  ) {}

  static create(
    id: string,
    text: string,
    embedding: number[],
    model: string,
    createdAt: Date,
    chunkId?: string,
    level?: number,
    startIndex?: number,
    endIndex?: number,
    childIds?: string[],
    parentId?: string,
    parentText?: string,
    contextKeywords?: string[],
    score?: number,
  ): TextDocument {
    return new TextDocument(
      id,
      text,
      new Embedding(embedding),
      model,
      createdAt,
      chunkId,
      level,
      startIndex,
      endIndex,
      childIds,
      parentId,
      parentText,
      contextKeywords,
      score,
    );
  }
}
