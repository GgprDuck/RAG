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
exports.ImageRagService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const image_document_entity_1 = require("../../domain/entities/image-document.entity");
const embedding_vo_1 = require("../../domain/value-objects/embedding.vo");
const similarity_score_vo_1 = require("../../domain/value-objects/similarity-score.vo");
const embedding_util_1 = require("../utils/embedding.util");
const text_query_util_1 = require("../utils/text-query.util");
let ImageRagService = class ImageRagService {
    constructor(ragSettings, embeddingPort, chatLlm, storage, imageRepository, logger) {
        this.ragSettings = ragSettings;
        this.embeddingPort = embeddingPort;
        this.chatLlm = chatLlm;
        this.storage = storage;
        this.imageRepository = imageRepository;
        this.logger = logger;
    }
    async uploadImages(files) {
        const { ollamaEmbedModelText: embedModel } = this.ragSettings.get();
        const createdAt = new Date();
        const documents = await Promise.all(files.map(async (file) => {
            const id = (0, uuid_1.v4)();
            const s3Key = `images/${id}/${file.originalname || 'image'}`;
            const [s3Url, description] = await Promise.all([
                this.storage.uploadFile(s3Key, file.buffer, file.mimetype),
                this.chatLlm.describeImage(file.buffer, file.mimetype),
            ]);
            const [embeddingRaw, keywords] = await Promise.all([
                this.embeddingPort.embed(description),
                this.chatLlm.extractKeywords(description),
            ]);
            const embedding = (0, embedding_util_1.extractEmbedding)(embeddingRaw);
            if (!embedding)
                throw new Error(`Failed to embed image description for ${file.originalname}`);
            return image_document_entity_1.ImageDocument.create(id, s3Url, s3Key, file.mimetype, description, keywords, embedding, embedModel, createdAt);
        }));
        await this.imageRepository.saveMany(documents);
        return { imagesUploaded: documents.length };
    }
    async deleteImageById(id) {
        const document = await this.imageRepository.findById(id);
        if (document) {
            await this.storage.deleteFile(document.s3Key);
        }
        await this.imageRepository.deleteById(id);
        return { deletedImageId: id };
    }
    async getImagesByKeyword(query, limit = 10) {
        const { imageRagMinScoreThreshold } = this.ragSettings.get();
        const minScore = new similarity_score_vo_1.SimilarityScore(imageRagMinScoreThreshold);
        const embeddingRaw = await this.embeddingPort.embed(query);
        const embedding = (0, embedding_util_1.extractEmbedding)(embeddingRaw);
        if (!embedding)
            return [];
        const queryEmbedding = new embedding_vo_1.Embedding(embedding);
        let documents = [];
        try {
            documents = await this.imageRepository.findByEmbedding(queryEmbedding, Math.max(limit, 100), minScore);
        }
        catch (err) {
            this.logger.error('Failed to query Qdrant for images', { err });
            throw new common_1.InternalServerErrorException('Image search failed. Please try again later.');
        }
        const { include, exclude } = (0, text_query_util_1.parseQueryWithNegation)(query);
        documents = documents.map((doc) => {
            const kws = doc.keywords.map((k) => k.toLowerCase());
            let score = doc.score?.value ?? 0;
            if (exclude.length > 0) {
                score = exclude.some((e) => kws.includes(e.toLowerCase()))
                    ? Math.max(0, score - 0.2)
                    : Math.min(1, score + 0.2);
            }
            for (const word of include) {
                for (const keyword of kws) {
                    const dist = (0, text_query_util_1.levenshteinDistance)(keyword, word.toLowerCase());
                    if (keyword.includes(word.toLowerCase()) || dist <= 1) {
                        score = score + 0.2;
                        break;
                    }
                }
            }
            return doc.withScore(score);
        });
        documents.sort((a, b) => (b.score?.value ?? 0) - (a.score?.value ?? 0));
        documents = documents
            .filter((doc) => (doc.score?.value ?? 0) >= minScore.value)
            .slice(0, limit);
        return documents.map((doc) => ({
            id: doc.id,
            s3Url: doc.s3Url,
            s3Key: doc.s3Key,
            mimeType: doc.mimeType,
            description: doc.description,
            embedding: doc.embedding.values,
            keywords: doc.keywords,
            score: doc.score?.value ?? 0,
            createdAt: doc.createdAt.toISOString(),
            model: doc.model,
        }));
    }
    async getAllImages(limit = 1000) {
        const documents = await this.imageRepository.findAll(limit);
        return documents.map((doc) => ({
            id: doc.id,
            s3Url: doc.s3Url,
            mimeType: doc.mimeType,
            description: doc.description,
            keywords: doc.keywords,
            embedding: doc.embedding.values,
            createdAt: doc.createdAt.toISOString(),
            model: doc.model,
        }));
    }
};
exports.ImageRagService = ImageRagService;
exports.ImageRagService = ImageRagService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IRagSettingsPort')),
    __param(1, (0, common_1.Inject)('IEmbeddingPort')),
    __param(2, (0, common_1.Inject)('IChatLlmPort')),
    __param(3, (0, common_1.Inject)('IStoragePort')),
    __param(4, (0, common_1.Inject)('IImageDocumentRepository')),
    __param(5, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], ImageRagService);
//# sourceMappingURL=image-rag.service.js.map