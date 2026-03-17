"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteDocumentHandler = void 0;
const common_1 = require("@nestjs/common");
let DeleteDocumentHandler = class DeleteDocumentHandler {
    constructor(textRag, logger) {
        this.textRag = textRag;
        this.logger = logger;
    }
    async execute(cmd) {
        if (!cmd.id || typeof cmd.id !== 'string' || !cmd.id.trim()) {
            this.logger.log('DeleteDocument_Invalid', { id: cmd.id });
            throw new common_1.BadRequestException('A valid document ID must be provided.');
        }
        this.logger.log('DeleteDocument', { id: cmd.id });
        return this.textRag.deleteById(cmd.id);
    }
};
exports.DeleteDocumentHandler = DeleteDocumentHandler;
exports.DeleteDocumentHandler = DeleteDocumentHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('TextRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], DeleteDocumentHandler);
//# sourceMappingURL=delete-document.handler.js.map