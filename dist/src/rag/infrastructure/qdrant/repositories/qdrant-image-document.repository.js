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
exports.QdrantImageDocumentRepository = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const collection_config_vo_1 = require("../../../domain/value-objects/collection-config.vo");
const rag_qdrant_service_1 = require("../rag-qdrant.service");
const rag_config_1 = require("../../config/rag-config");
const image_document_qdrant_mapper_1 = require("../../mappers/image-document.qdrant.mapper");
let QdrantImageDocumentRepository = class QdrantImageDocumentRepository {
    constructor(qdrant, configService, logger) {
        this.qdrant = qdrant;
        this.configService = configService;
        this.logger = logger;
        const ragConfig = this.configService.get(rag_config_1.RAG_CONFIG);
        const vectorSize = ragConfig?.imageRagVectorSize || 768;
        const hnswConfig = ragConfig?.imageRagHnswConfig;
        this.collectionConfig = new collection_config_vo_1.CollectionConfig(ragConfig?.imageRagCollectionName || 'rag_images', vectorSize, 'Cosine', hnswConfig
            ? {
                m: hnswConfig.m,
                efConstruct: hnswConfig.efConstruct,
                efSearch: hnswConfig.efSearch,
            }
            : undefined);
    }
    async onModuleInit() {
        await this.qdrant.ensureCollectionWithConfig(this.collectionConfig);
        this.logger.log(`Qdrant text collection "${this.collectionConfig.name}" is ready`);
    }
    async save(document) {
        await this.saveMany([document]);
    }
    async saveMany(documents) {
        if (documents.length === 0)
            return;
        const points = documents.map((doc) => image_document_qdrant_mapper_1.ImageDocumentQdrantMapper.toPoint(doc));
        await this.qdrant.upsert(this.collectionConfig.name, points);
    }
    async findByEmbedding(embedding, limit) {
        const searchLimit = Math.max(limit, 100);
        const results = await this.qdrant.search(this.collectionConfig.name, {
            vector: embedding.values,
            limit: searchLimit,
            params: {
                hnsw_ef: this.collectionConfig.hnswConfig?.efSearch || 64,
            },
        });
        return results
            .slice(0, limit)
            .map((result) => image_document_qdrant_mapper_1.ImageDocumentQdrantMapper.fromPoint(result, result.score));
    }
    async findAll(limit = 1000) {
        const results = await this.qdrant.scroll(this.collectionConfig.name, {
            limit,
        });
        return (results.points || []).map((point) => image_document_qdrant_mapper_1.ImageDocumentQdrantMapper.fromPoint(point));
    }
    async deleteById(id) {
        await this.qdrant.deletePoints(this.collectionConfig.name, [id]);
    }
    async findById(id) {
        try {
            const results = await this.qdrant.scroll(this.collectionConfig.name, {
                filter: {
                    must: [{ key: 'id', match: { value: id } }],
                },
                limit: 1,
            });
            if (!results.points || results.points.length === 0) {
                return null;
            }
            return image_document_qdrant_mapper_1.ImageDocumentQdrantMapper.fromPoint(results.points[0]);
        }
        catch (err) {
            this.logger.error('Failed to find image by ID:', err);
            return null;
        }
    }
};
exports.QdrantImageDocumentRepository = QdrantImageDocumentRepository;
exports.QdrantImageDocumentRepository = QdrantImageDocumentRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [rag_qdrant_service_1.RagQdrantService,
        config_1.ConfigService, Object])
], QdrantImageDocumentRepository);
//# sourceMappingURL=qdrant-image-document.repository.js.map