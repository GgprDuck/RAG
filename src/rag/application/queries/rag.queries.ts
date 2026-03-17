export class GetAllDocumentsQuery {}

export class GetAllImagesQuery {
  constructor(public readonly limit?: number) {}
}

export class GetImagesByKeywordQuery {
  constructor(
    public readonly query: string,
    public readonly limit?: number,
  ) {}
}

export class RetrieveDocumentsQuery {
  constructor(
    public readonly query: string,
    public readonly limit?: number,
    public readonly options?: {
      useHybridSearch?: boolean;
      useReranking?: boolean;
      rerankStrategy?: 'cross_encoder' | 'llm_based' | 'none';
      useQueryTransformation?: boolean;
      useContextualCompression?: boolean;
      scoreThreshold?: number;
      filters?: Array<{ field: string; value: unknown; operator?: string }>;
    },
  ) {}
}
