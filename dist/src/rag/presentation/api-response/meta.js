"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meta = void 0;
class Meta {
    constructor(partial) {
        Object.assign(this, partial);
        this.timestamp = new Date().toISOString();
    }
}
exports.Meta = Meta;
//# sourceMappingURL=meta.js.map