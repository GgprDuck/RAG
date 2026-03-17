"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocument = void 0;
const embedding_vo_1 = require("../value-objects/embedding.vo");
class TextDocument {
    constructor(id, text, embedding, model, createdAt, chunkId, level, startIndex, endIndex, childIds, parentId, parentText, contextKeywords, score) {
        this.id = id;
        this.text = text;
        this.embedding = embedding;
        this.model = model;
        this.createdAt = createdAt;
        this.chunkId = chunkId;
        this.level = level;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.childIds = childIds;
        this.parentId = parentId;
        this.parentText = parentText;
        this.contextKeywords = contextKeywords;
        this.score = score;
    }
    static create(id, text, embedding, model, createdAt, chunkId, level, startIndex, endIndex, childIds, parentId, parentText, contextKeywords, score) {
        return new TextDocument(id, text, new embedding_vo_1.Embedding(embedding), model, createdAt, chunkId, level, startIndex, endIndex, childIds, parentId, parentText, contextKeywords, score);
    }
}
exports.TextDocument = TextDocument;
//# sourceMappingURL=text-document.entity.js.map