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
    constructor(textRag, logger, confidencePort) {
        this.textRag = textRag;
        this.logger = logger;
        this.confidencePort = confidencePort;
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
        const chunks = (raw.sources?.length ? raw.sources : (raw.citations ?? []))
            .map((s) => s.text)
            .filter(Boolean);
        const verification = await this.confidencePort.verify(raw.answer, chunks);
        this.logger.log('AskQuestion_Confidence', {
            score: verification.confidence.score,
            tier: verification.confidence.tier,
            grounded: verification.grounded,
            llmVerificationUsed: verification.llmVerificationUsed,
            llmVerdict: verification.llmVerdict,
        });
        let finalAnswer = raw.answer;
        if (!verification.grounded && verification.llmVerdict === 'NO') {
            finalAnswer = 'Немає релевантної відповіді';
        }
        return {
            ...raw,
            confidence: verification.confidence.score,
            formattedAnswer: finalAnswer,
        };
    }
    streamableExecute(cmd) {
        if (!cmd.question || typeof cmd.question !== 'string' || !cmd.question.trim()) {
            this.logger.log('AskQuestion_Stream_Invalid', { q: cmd.question });
            return (async function* () {
                yield { event: 'error', error: 'A valid question must be provided.' };
            })();
        }
        const opts = cmd.options;
        this.logger.log('AskQuestion_Stream', {
            q: cmd.question,
            hasFilters: (opts?.filters?.length ?? 0) > 0,
        });
        return this.textRag.streamableGenerateAnswer(cmd.question, {
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
            useKnowledgeGraph: opts?.useKnowledgeGraph,
            temperature: opts?.temperature,
            topP: opts?.topP,
            topK: opts?.topK,
            maxTokens: opts?.maxTokens,
            includeSources: opts?.includeSources,
            sessionId: opts?.sessionId,
            conversationHistory: opts?.conversationHistory,
        });
    }
};
exports.AskQuestionHandler = AskQuestionHandler;
exports.AskQuestionHandler = AskQuestionHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('TextRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __param(2, (0, common_1.Inject)('IConfidencePort')),
    __metadata("design:paramtypes", [Object, Object, Object])
], AskQuestionHandler);
//# sourceMappingURL=ask-question.handler.js.map