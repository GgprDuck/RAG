"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionConfig = void 0;
class CollectionConfig {
    constructor(name, vectorSize, distance = 'Cosine', hnswConfig) {
        this.name = name;
        this.vectorSize = vectorSize;
        this.distance = distance;
        this.hnswConfig = hnswConfig;
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
exports.CollectionConfig = CollectionConfig;
//# sourceMappingURL=collection-config.vo.js.map