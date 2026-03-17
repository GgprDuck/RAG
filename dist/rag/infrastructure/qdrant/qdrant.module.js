"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rag_qdrant_service_1 = require("./rag-qdrant.service");
const qdrant_image_document_repository_1 = require("./repositories/qdrant-image-document.repository");
const qdrant_text_document_repository_1 = require("./repositories/qdrant-text-document.repository");
const ollama_module_1 = require("../ollama/ollama.module");
const s3_module_1 = require("../s3/s3.module");
const console_logger_adapter_1 = require("../../shared/application/ports/console.logger.adapter");
let QdrantModule = class QdrantModule {
};
exports.QdrantModule = QdrantModule;
exports.QdrantModule = QdrantModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, ollama_module_1.OllamaModule, s3_module_1.S3Module],
        providers: [
            rag_qdrant_service_1.RagQdrantService,
            qdrant_image_document_repository_1.QdrantImageDocumentRepository,
            qdrant_text_document_repository_1.QdrantTextDocumentRepository,
            {
                provide: 'ITextDocumentRepository',
                useExisting: qdrant_text_document_repository_1.QdrantTextDocumentRepository,
            },
            {
                provide: 'IImageDocumentRepository',
                useExisting: qdrant_image_document_repository_1.QdrantImageDocumentRepository,
            },
            {
                provide: 'LoggerPort',
                useClass: console_logger_adapter_1.ConsoleLoggerAdapter,
            },
        ],
        exports: [
            rag_qdrant_service_1.RagQdrantService,
            qdrant_text_document_repository_1.QdrantTextDocumentRepository,
            qdrant_image_document_repository_1.QdrantImageDocumentRepository,
        ],
    })
], QdrantModule);
//# sourceMappingURL=qdrant.module.js.map