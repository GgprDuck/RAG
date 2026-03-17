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
exports.GetAllDocumentsHandler = void 0;
const common_1 = require("@nestjs/common");
let GetAllDocumentsHandler = class GetAllDocumentsHandler {
    constructor(textRag, logger) {
        this.textRag = textRag;
        this.logger = logger;
    }
    async execute(_cmd) {
        if (!_cmd || typeof _cmd !== 'object') {
            this.logger.log('GetAllDocuments_Invalid', { cmd: _cmd });
            throw new common_1.BadRequestException('A valid command object must be provided.');
        }
        this.logger.log('GetAllDocuments', { action: 'execute' });
        return this.textRag.getAllDocuments();
    }
};
exports.GetAllDocumentsHandler = GetAllDocumentsHandler;
exports.GetAllDocumentsHandler = GetAllDocumentsHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('TextRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], GetAllDocumentsHandler);
//# sourceMappingURL=get-all-documents.handler.js.map