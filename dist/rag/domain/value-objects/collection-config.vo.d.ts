export type DistanceMetric = 'Cosine' | 'Euclid' | 'Dot';
export interface HnswConfig {
    m: number;
    efConstruct: number;
    efSearch?: number;
}
export declare class CollectionConfig {
    readonly name: string;
    readonly vectorSize: number;
    readonly distance: DistanceMetric;
    readonly hnswConfig?: HnswConfig | undefined;
    constructor(name: string, vectorSize: number, distance?: DistanceMetric, hnswConfig?: HnswConfig | undefined);
}
