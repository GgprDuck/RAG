"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocumentQdrantMapper = void 0;
const text_document_entity_1 = require("../../domain/entities/text-document.entity");
const embedding_vo_1 = require("../../domain/value-objects/embedding.vo");
class TextDocumentQdrantMapper {
    static toPoint(doc) {
        return {
            id: doc.id,
            vector: doc.embedding.values,
            payload: {
                text: doc.text,
                createdAt: doc.createdAt.toISOString(),
                model: doc.model,
                chunkId: doc.chunkId,
                level: doc.level,
                startIndex: doc.startIndex,
                endIndex: doc.endIndex,
                childIds: doc.childIds,
                parentId: doc.parentId,
                parentText: doc.parentText,
                contextKeywords: doc.contextKeywords,
            },
        };
    }
    static fromPoint(point, model) {
        const createdAt = point.payload?.createdAt
            ? new Date(String(point.payload.createdAt))
            : new Date();
        const resolvedModel = model ?? String(point.payload?.model ?? 'unknown');
        const payload = point.payload;
        return new text_document_entity_1.TextDocument(String(point.id), String(payload?.text ?? ''), new embedding_vo_1.Embedding(point.vector ?? []), resolvedModel, createdAt, payload?.chunkId ? String(payload.chunkId) : undefined, payload?.level != null ? Number(payload.level) : undefined, payload?.startIndex != null ? Number(payload.startIndex) : undefined, payload?.endIndex != null ? Number(payload.endIndex) : undefined, Array.isArray(payload?.childIds) ? payload.childIds : undefined, payload?.parentId ? String(payload.parentId) : undefined, payload?.parentText ? String(payload.parentText) : undefined, Array.isArray(payload?.contextKeywords) ? payload.contextKeywords : undefined);
    }
}
exports.TextDocumentQdrantMapper = TextDocumentQdrantMapper;
//# sourceMappingURL=text-document.qdrant.mapper.js.map