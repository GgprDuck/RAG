"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWordText = extractWordText;
const mammoth = require("mammoth");
async function extractWordText(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}
//# sourceMappingURL=word-parser.util.js.map