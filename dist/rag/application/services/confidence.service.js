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
var ConfidenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const DEFAULT_THRESHOLDS = {
    high: 0.85,
    low: 0.65,
};
let ConfidenceService = ConfidenceService_1 = class ConfidenceService {
    constructor(embeddingPort, chatPort, configService) {
        this.embeddingPort = embeddingPort;
        this.chatPort = chatPort;
        this.configService = configService;
        this.logger = new common_1.Logger(ConfidenceService_1.name);
        this.MAX_EMBED_CHARS = 5000;
        this.MAX_CHUNKS_TO_COMPARE = 5;
    }
    async computeScore(answer, retrievedChunks, thresholds) {
        const t = this.resolveThresholds(thresholds);
        if (!answer?.trim() || !retrievedChunks.length) {
            return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
        }
        const filteredChunks = this.filterChunksByKeywords(retrievedChunks, answer);
        if (!filteredChunks.length) {
            return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
        }
        const topChunks = filteredChunks.slice(0, this.MAX_CHUNKS_TO_COMPARE);
        const answerVec = await this.safeEmbed(answer);
        if (!answerVec) {
            return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
        }
        const chunkVectors = await Promise.all(topChunks.map((chunk) => this.safeEmbed(chunk)));
        let bestScore = -1;
        let bestChunkIndex = 0;
        for (let i = 0; i < chunkVectors.length; i++) {
            const chunkVec = chunkVectors[i];
            if (!chunkVec)
                continue;
            const sim = cosineSimilarity(answerVec, chunkVec);
            if (sim > bestScore) {
                bestScore = sim;
                bestChunkIndex = i;
            }
        }
        if (bestScore === -1) {
            return { score: 0, tier: 'LOW', bestChunkIndex: 0 };
        }
        const tier = this.scoreTier(bestScore, t);
        this.logger.debug(`Confidence score: ${bestScore.toFixed(3)} → tier: ${tier}`);
        return {
            score: bestScore,
            tier,
            bestChunkIndex,
        };
    }
    async verify(answer, retrievedChunks, thresholds) {
        if (!answer?.trim() || !retrievedChunks.length) {
            return {
                grounded: false,
                confidence: { score: 0, tier: 'LOW', bestChunkIndex: 0 },
                llmVerificationUsed: false,
                message: 'Немає релевантної відповіді',
            };
        }
        const confidence = await this.computeScore(answer, retrievedChunks, thresholds);
        if (confidence.tier === 'LOW') {
            return {
                grounded: false,
                confidence,
                llmVerificationUsed: false,
                message: 'Немає релевантної відповіді',
            };
        }
        if (confidence.tier === 'HIGH') {
            return {
                grounded: true,
                confidence,
                llmVerificationUsed: false,
            };
        }
        const bestContext = retrievedChunks[confidence.bestChunkIndex];
        const llmScore = await this.llmRelevanceScore(answer, bestContext);
        const finalScore = (confidence.score + llmScore) / 2;
        const grounded = finalScore >= 0.65;
        return {
            grounded,
            confidence: {
                ...confidence,
                score: finalScore,
            },
            llmVerificationUsed: true,
            llmVerdict: llmScore >= 0.15 ? 'YES' : 'NO',
            message: grounded ? undefined : 'Немає релевантної відповіді',
        };
    }
    async llmRelevanceScore(answer, context) {
        const trimmedContext = this.trimForEmbedding(context);
        const systemPrompt = `
      You are a semantic relevance scorer for a RAG system.

      Your task:
      Return a number between 0 and 1 representing how semantically related
      the ANSWER is to the CONTEXT.

      0 = completely unrelated topic
      0.5 = partially related / weak topical overlap
      1 = clearly about the same topic

      Be tolerant to paraphrasing.
      Do not require exact wording overlap.
      Return ONLY a number between 0 and 1.
    `;
        const userPrompt = `
      CONTEXT:
      ${trimmedContext}

      ANSWER:
      ${answer}

      Relevance score:
    `;
        try {
            const raw = await this.chatPort.complete(`${systemPrompt}\n\n${userPrompt}`);
            const parsed = parseFloat(raw.trim().replace(',', '.'));
            if (isNaN(parsed))
                return 0;
            return Math.max(0, Math.min(1, parsed));
        }
        catch {
            return 0;
        }
    }
    async safeEmbed(text) {
        try {
            const trimmed = this.trimForEmbedding(text);
            return await this.embeddingPort.embed(trimmed);
        }
        catch {
            return null;
        }
    }
    trimForEmbedding(text) {
        if (!text)
            return '';
        return text.length > this.MAX_EMBED_CHARS ? text.slice(0, this.MAX_EMBED_CHARS) : text;
    }
    scoreTier(score, t) {
        if (score >= t.high)
            return 'HIGH';
        if (score < t.low)
            return 'LOW';
        return 'GRAY_ZONE';
    }
    resolveThresholds(override) {
        return {
            high: override?.high ?? this.configService.get('rag.confidence.high', DEFAULT_THRESHOLDS.high),
            low: override?.low ?? this.configService.get('rag.confidence.low', DEFAULT_THRESHOLDS.low),
        };
    }
    filterChunksByKeywords(chunks, question) {
        const keywords = question.toLowerCase().match(/\w+/g) || [];
        return chunks.filter((chunk) => keywords.some((k) => chunk.toLowerCase().includes(k)));
    }
};
exports.ConfidenceService = ConfidenceService;
exports.ConfidenceService = ConfidenceService = ConfidenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IEmbeddingPort')),
    __param(1, (0, common_1.Inject)('IChatLlmPort')),
    __metadata("design:paramtypes", [Object, Object, config_1.ConfigService])
], ConfidenceService);
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}
//# sourceMappingURL=confidence.service.js.map