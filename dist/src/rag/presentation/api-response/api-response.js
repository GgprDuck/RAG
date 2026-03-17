"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const meta_1 = require("./meta");
class ApiResponse {
    constructor(success, data, meta) {
        this.success = success;
        this.data = data;
        this.meta = meta;
    }
    static success(data, meta) {
        return new ApiResponse(true, data, meta || new meta_1.Meta({}));
    }
    static error(message, data) {
        return new ApiResponse(false, data, new meta_1.Meta({ message }));
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.js.map