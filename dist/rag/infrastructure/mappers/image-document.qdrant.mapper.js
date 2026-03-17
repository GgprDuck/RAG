"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageDocumentQdrantMapper = void 0;
const image_document_entity_1 = require("../../domain/entities/image-document.entity");
const embedding_vo_1 = require("../../domain/value-objects/embedding.vo");
const similarity_score_vo_1 = require("../../domain/value-objects/similarity-score.vo");
class ImageDocumentQdrantMapper {
    static toPoint(doc) {
        return {
            id: doc.id,
            vector: doc.embedding.values,
            payload: {
                s3Url: doc.s3Url,
                s3Key: doc.s3Key,
                mimeType: doc.mimeType,
                description: doc.description,
                keywords: doc.keywords,
                createdAt: doc.createdAt.toISOString(),
                model: doc.model,
            },
        };
    }
    static fromPoint(point, score) {
        const createdAt = point.payload?.createdAt
            ? new Date(String(point.payload.createdAt))
            : new Date();
        const doc = new image_document_entity_1.ImageDocument(String(point.id), String(point.payload?.s3Url ?? ''), String(point.payload?.s3Key ?? ''), String(point.payload?.mimeType ?? 'image/png'), String(point.payload?.description ?? ''), Array.isArray(point.payload?.keywords)
            ? point.payload.keywords.map(String)
            : [], new embedding_vo_1.Embedding(point.vector ?? []), createdAt, String(point.payload?.model ?? 'unknown'));
        return score !== undefined
            ? new image_document_entity_1.ImageDocument(doc.id, doc.s3Url, doc.s3Key, doc.mimeType, doc.description, doc.keywords, doc.embedding, doc.createdAt, doc.model, new similarity_score_vo_1.SimilarityScore(score))
            : doc;
    }
}
exports.ImageDocumentQdrantMapper = ImageDocumentQdrantMapper;
//# sourceMappingURL=image-document.qdrant.mapper.js.map