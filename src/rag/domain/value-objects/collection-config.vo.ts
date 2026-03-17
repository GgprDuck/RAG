export type DistanceMetric = 'Cosine' | 'Euclid' | 'Dot';

export interface HnswConfig {
  m: number;
  efConstruct: number;
  efSearch?: number;
}

export class CollectionConfig {
  constructor(
    public readonly name: string,
    public readonly vectorSize: number,
    public readonly distance: DistanceMetric = 'Cosine',
    public readonly hnswConfig?: HnswConfig,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Collection name cannot be empty');
    }
    if (vectorSize <= 0) {
      throw new Error('Vector size must be positive');
    }
    if (hnswConfig) {
      if (hnswConfig.m <= 0 || hnswConfig.efConstruct <= 0) {
        throw new Error('HNSW config values must be positive');
      }
    }
  }
}
