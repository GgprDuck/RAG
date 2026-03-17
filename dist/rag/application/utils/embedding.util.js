"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEmbedding = extractEmbedding;
function extractEmbedding(input) {
    if (Array.isArray(input) &&
        input.every((n) => typeof n === 'number')) {
        return input;
    }
    if (typeof input === 'object' && input !== null) {
        const obj = input;
        if (Array.isArray(obj.embedding) &&
            obj.embedding.every((n) => typeof n === 'number')) {
            return obj.embedding;
        }
        if (Array.isArray(obj.data) &&
            obj.data.length > 0 &&
            Array.isArray(obj.data[0]?.embedding) &&
            (obj.data[0]?.embedding).every((n) => typeof n === 'number')) {
            return obj.data[0]?.embedding;
        }
    }
    return [];
}
//# sourceMappingURL=embedding.util.js.map