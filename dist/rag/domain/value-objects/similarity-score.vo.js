"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimilarityScore = void 0;
class SimilarityScore {
    constructor(value) {
        if (value < 0 || value > 1) {
            throw new Error('Similarity score must be more than 0');
        }
        this._value = value;
    }
    get value() {
        return this._value;
    }
    equals(other) {
        return Math.abs(this._value - other._value) < 1e-9;
    }
    isGreaterThan(threshold) {
        return this._value >= threshold;
    }
}
exports.SimilarityScore = SimilarityScore;
//# sourceMappingURL=similarity-score.vo.js.map