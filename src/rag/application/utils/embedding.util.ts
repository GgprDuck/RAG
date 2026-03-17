type EmbeddingObject = { embedding?: number[] };
type EmbeddingDataObject = { data?: Array<{ embedding?: number[] }> };

export function extractEmbedding(input: unknown): number[] {
  if (
    Array.isArray(input) &&
    (input as unknown[]).every((n): n is number => typeof n === 'number')
  ) {
    return input as number[];
  }

  if (typeof input === 'object' && input !== null) {
    const obj = input as Partial<EmbeddingObject & EmbeddingDataObject>;

    if (
      Array.isArray(obj.embedding) &&
      obj.embedding.every((n): n is number => typeof n === 'number')
    ) {
      return obj.embedding as number[];
    }

    if (
      Array.isArray(obj.data) &&
      obj.data.length > 0 &&
      Array.isArray(obj.data[0]?.embedding) &&
      (obj.data[0]?.embedding as unknown[]).every((n): n is number => typeof n === 'number')
    ) {
      return obj.data[0]?.embedding as number[];
    }
  }

  return [];
}
