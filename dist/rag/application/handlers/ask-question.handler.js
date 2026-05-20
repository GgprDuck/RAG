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
exports.AskQuestionHandler = void 0;
const common_1 = require("@nestjs/common");
let AskQuestionHandler = class AskQuestionHandler {
    constructor(textRag, logger) {
        this.textRag = textRag;
        this.logger = logger;
    }
    async execute(cmd) {
        if (!cmd.question || typeof cmd.question !== 'string' || !cmd.question.trim()) {
            this.logger.log('AskQuestion_Invalid', { q: cmd.question });
            throw new common_1.BadRequestException('A valid question must be provided.');
        }
        const opts = cmd.options;
        this.logger.log('AskQuestion', {
            q: cmd.question,
            limit: opts?.limit,
            scoreThreshold: opts?.scoreThreshold,
            useHybridSearch: opts?.useHybridSearch,
            useReranking: opts?.useReranking,
            rerankStrategy: opts?.rerankStrategy,
            useQueryTransform: opts?.useQueryTransformation,
            useCompression: opts?.useContextualCompression,
            useMemory: opts?.useConversationMemory,
            useCitations: opts?.useCitationTracking,
            includeDiagnostics: opts?.includeRetrievalDiagnostics,
            useAnswerCache: opts?.useAnswerCache,
            useKG: opts?.useKnowledgeGraph,
            temperature: opts?.temperature,
            maxTokens: opts?.maxTokens,
            includeSources: opts?.includeSources,
            hasHistory: (opts?.conversationHistory?.length ?? 0) > 0,
            hasFilters: (opts?.filters?.length ?? 0) > 0,
        });
        const raw = await this.textRag.generateAnswer(cmd.question, {
            limit: opts?.limit,
            scoreThreshold: opts?.scoreThreshold,
            filters: opts?.filters,
            useHybridSearch: opts?.useHybridSearch,
            useReranking: opts?.useReranking,
            rerankStrategy: opts?.rerankStrategy,
            useQueryTransformation: opts?.useQueryTransformation,
            useContextualCompression: opts?.useContextualCompression,
            useConversationMemory: opts?.useConversationMemory,
            useCitationTracking: opts?.useCitationTracking,
            includeRetrievalDiagnostics: opts?.includeRetrievalDiagnostics,
            useAnswerCache: opts?.useAnswerCache,
            useKnowledgeGraph: opts?.useKnowledgeGraph,
            temperature: opts?.temperature,
            topP: opts?.topP,
            topK: opts?.topK,
            maxTokens: opts?.maxTokens,
            includeSources: opts?.includeSources,
            sessionId: opts?.sessionId,
            conversationHistory: opts?.conversationHistory,
        });
        if (typeof raw === 'string') {
            return { answer: raw };
        }
        return raw;
    }
};
exports.AskQuestionHandler = AskQuestionHandler;
exports.AskQuestionHandler = AskQuestionHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('TextRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], AskQuestionHandler);
//# sourceMappingURL=ask-question.handler.js.map