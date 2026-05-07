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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AskDto = exports.AdvancedRagOptionsDto = exports.MetadataFilter = exports.ConversationMessage = exports.RerankStrategy = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var RerankStrategy;
(function (RerankStrategy) {
    RerankStrategy["NONE"] = "none";
    RerankStrategy["CROSS_ENCODER"] = "cross_encoder";
    RerankStrategy["LLM_BASED"] = "llm_based";
})(RerankStrategy || (exports.RerankStrategy = RerankStrategy = {}));
class ConversationMessage {
}
exports.ConversationMessage = ConversationMessage;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Role of the message sender',
        enum: ['user', 'assistant'],
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationMessage.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Content of the message',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationMessage.prototype, "content", void 0);
class MetadataFilter {
}
exports.MetadataFilter = MetadataFilter;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Metadata field name to filter by',
        example: 'category',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetadataFilter.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Value used by the filter operation',
        example: 'hr',
    }),
    (0, class_validator_1.IsDefined)(),
    __metadata("design:type", Object)
], MetadataFilter.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Comparison operator',
        enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in'],
        default: 'eq',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetadataFilter.prototype, "operator", void 0);
class AdvancedRagOptionsDto {
}
exports.AdvancedRagOptionsDto = AdvancedRagOptionsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Use hybrid (vector + BM25 keyword) search' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useHybridSearch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Re-rank results after retrieval' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useReranking", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: RerankStrategy,
        description: 'Reranking strategy — set to "none" to disable reranking entirely',
        default: RerankStrategy.NONE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RerankStrategy),
    __metadata("design:type", String)
], AdvancedRagOptionsDto.prototype, "rerankStrategy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Expand and rephrase query before retrieval' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useQueryTransformation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false, description: 'Compress retrieved chunks to relevant sentences only' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useContextualCompression", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false, description: 'Use conversation session memory' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useConversationMemory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Track and return citation sources in response' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useCitationTracking", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false, description: 'Include retrieval diagnostics in response metadata' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "includeRetrievalDiagnostics", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Enable short-lived answer cache for repeated questions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useAnswerCache", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false, description: 'Enrich context with Neo4j knowledge graph entities' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdvancedRagOptionsDto.prototype, "useKnowledgeGraph", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Session Id for conversation memory (required when useConversationMemory=true)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdvancedRagOptionsDto.prototype, "sessionId", void 0);
class AskDto {
}
exports.AskDto = AskDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'What is Node.js?',
        description: 'Question to ask the RAG system (max 2000 characters)',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Question cannot be empty' }),
    (0, class_validator_1.IsString)({ message: 'Question must be a string' }),
    (0, class_validator_1.MaxLength)(2000, {
        message: 'Question is too long (max 2000 characters)',
    }),
    __metadata("design:type", String)
], AskDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 6,
        description: 'Number of documents to retrieve (1-20)',
        default: 6,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], AskDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 0.65,
        description: 'Minimum similarity score threshold (0-1).',
        default: 0.0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AskDto.prototype, "scoreThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 0.3,
        description: 'LLM temperature for response generation (0-1).',
        default: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AskDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 0.95,
        description: 'Top-p nucleus sampling parameter (0-1).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AskDto.prototype, "topP", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 40,
        description: 'Top-k sampling parameter (1-100).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AskDto.prototype, "topK", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [ConversationMessage],
        description: 'Previous conversation history for context-aware responses',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConversationMessage),
    __metadata("design:type", Array)
], AskDto.prototype, "conversationHistory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [MetadataFilter],
        description: 'Metadata filters to narrow document search',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MetadataFilter),
    __metadata("design:type", Array)
], AskDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: RerankStrategy,
        description: 'Deprecated: top-level reranking strategy. Prefer options.rerankStrategy.',
        default: RerankStrategy.NONE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RerankStrategy),
    __metadata("design:type", String)
], AskDto.prototype, "rerankStrategy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Include source documents in response',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AskDto.prototype, "includeSources", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2048,
        description: 'Maximum tokens for LLM response (100-4096)',
        default: 1024,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(4096),
    __metadata("design:type", Number)
], AskDto.prototype, "maxTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: AdvancedRagOptionsDto,
        description: 'Advanced RAG pipeline options (hybrid search, re-ranking, citations, etc.)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AdvancedRagOptionsDto),
    __metadata("design:type", AdvancedRagOptionsDto)
], AskDto.prototype, "options", void 0);
//# sourceMappingURL=ask.dto.js.map