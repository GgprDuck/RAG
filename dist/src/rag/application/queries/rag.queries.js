"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrieveDocumentsQuery = exports.GetImagesByKeywordQuery = exports.GetAllImagesQuery = exports.GetAllDocumentsQuery = void 0;
class GetAllDocumentsQuery {
}
exports.GetAllDocumentsQuery = GetAllDocumentsQuery;
class GetAllImagesQuery {
    constructor(limit) {
        this.limit = limit;
    }
}
exports.GetAllImagesQuery = GetAllImagesQuery;
class GetImagesByKeywordQuery {
    constructor(query, limit) {
        this.query = query;
        this.limit = limit;
    }
}
exports.GetImagesByKeywordQuery = GetImagesByKeywordQuery;
class RetrieveDocumentsQuery {
    constructor(query, limit, options) {
        this.query = query;
        this.limit = limit;
        this.options = options;
    }
}
exports.RetrieveDocumentsQuery = RetrieveDocumentsQuery;
//# sourceMappingURL=rag.queries.js.map