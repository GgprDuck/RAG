"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Embedding = void 0;
class Embedding {
    constructor(values) {
        if (!values.every(v => typeof v === 'number')) {
            throw new Error('All embedding values must be numbers');
        }
        this._values = [...values];
    }
    get values() {
        return [...this._values];
    }
    get dimension() {
        return this._values.length;
    }
    equals(other) {
        if (this.dimension !== other.dimension)
            return false;
        return this._values.every((v, i) => Math.abs(v - other._values[i]) < 1e-9);
    }
}
exports.Embedding = Embedding;
//# sourceMappingURL=embedding.vo.js.map