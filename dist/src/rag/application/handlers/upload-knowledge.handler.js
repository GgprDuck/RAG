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
exports.UploadKnowledgeHandler = void 0;
const common_1 = require("@nestjs/common");
let UploadKnowledgeHandler = class UploadKnowledgeHandler {
    constructor(textRag, logger) {
        this.textRag = textRag;
        this.logger = logger;
    }
    async execute(cmd) {
        if (!cmd ||
            typeof cmd !== 'object' ||
            !cmd.file ||
            typeof cmd.file !== 'object' ||
            !cmd.file.originalname ||
            typeof cmd.file.originalname !== 'string' ||
            !cmd.file.originalname.trim()) {
            this.logger.log('UploadKnowledge_Invalid', { file: cmd?.file });
            throw new common_1.BadRequestException('A valid file must be provided.');
        }
        const { chunkingStrategy, enableKnowledgeGraph } = cmd.options ?? {};
        this.logger.log('UploadKnowledge', {
            file: cmd.file.originalname,
            chunkingStrategy: chunkingStrategy ?? 'simple',
            enableKnowledgeGraph: enableKnowledgeGraph ?? false,
        });
        return this.textRag.uploadKnowledgeFromFile(cmd.file, {
            chunkingStrategy,
            enableKnowledgeGraph,
        });
    }
};
exports.UploadKnowledgeHandler = UploadKnowledgeHandler;
exports.UploadKnowledgeHandler = UploadKnowledgeHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('TextRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], UploadKnowledgeHandler);
//# sourceMappingURL=upload-knowledge.handler.js.map