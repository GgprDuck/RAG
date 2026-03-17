import { Embedding } from '../value-objects/embedding.vo';
import { SimilarityScore } from '../value-objects/similarity-score.vo';
export declare class ImageDocument {
    readonly id: string;
    readonly s3Url: string;
    readonly s3Key: string;
    readonly mimeType: string;
    readonly description: string;
    readonly keywords: string[];
    readonly embedding: Embedding;
    readonly createdAt: Date;
    readonly model: string;
    readonly score?: SimilarityScore | undefined;
    constructor(id: string, s3Url: string, s3Key: string, mimeType: string, description: string, keywords: string[], embedding: Embedding, createdAt: Date, model: string, score?: SimilarityScore | undefined);
    static create(id: string, s3Url: string, s3Key: string, mimeType: string, description: string, keywords: string[], embedding: number[], model: string, createdAt?: Date): ImageDocument;
    withScore(score: number): ImageDocument;
}
