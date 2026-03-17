"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageDocument = void 0;
const embedding_vo_1 = require("../value-objects/embedding.vo");
const similarity_score_vo_1 = require("../value-objects/similarity-score.vo");
class ImageDocument {
    constructor(id, s3Url, s3Key, mimeType, description, keywords, embedding, createdAt, model, score) {
        this.id = id;
        this.s3Url = s3Url;
        this.s3Key = s3Key;
        this.mimeType = mimeType;
        this.description = description;
        this.keywords = keywords;
        this.embedding = embedding;
        this.createdAt = createdAt;
        this.model = model;
        this.score = score;
        if (!description || description.trim().length === 0) {
            throw new Error('Image description cannot be empty');
        }
        if (!Array.isArray(keywords)) {
            throw new Error('Keywords must be an array');
        }
        if (!s3Url || s3Url.trim().length === 0) {
            throw new Error('S3 URL cannot be empty');
        }
        if (!s3Key || s3Key.trim().length === 0) {
            throw new Error('S3 key cannot be empty');
        }
        if (!model || model.trim().length === 0) {
            throw new Error('Model cannot be empty');
        }
    }
    static create(id, s3Url, s3Key, mimeType, description, keywords, embedding, model, createdAt) {
        return new ImageDocument(id, s3Url, s3Key, mimeType, description, keywords, new embedding_vo_1.Embedding(embedding), createdAt || new Date(), model);
    }
    withScore(score) {
        return new ImageDocument(this.id, this.s3Url, this.s3Key, this.mimeType, this.description, this.keywords, this.embedding, this.createdAt, this.model, new similarity_score_vo_1.SimilarityScore(score));
    }
}
exports.ImageDocument = ImageDocument;
//# sourceMappingURL=image-document.entity.js.map