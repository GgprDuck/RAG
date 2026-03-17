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
exports.ConversationSessionPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const uuid_1 = require("uuid");
let ConversationSessionPrismaRepository = class ConversationSessionPrismaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addTurn(sessionId, query, answer, embedding) {
        await this.prisma.conversationSession.create({
            data: {
                id: (0, uuid_1.v4)(),
                sessionId,
                query,
                answer,
                embedding: embedding ?? [],
                timestamp: new Date(),
            },
        });
        await this.pruneOldTurns(sessionId, 50);
    }
    async getHistory(sessionId, maxTurns = 5) {
        const sessions = await this.prisma.conversationSession.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
            take: maxTurns,
        });
        return sessions
            .reverse()
            .map((s) => ({
            query: s.query,
            answer: s.answer,
            timestamp: s.timestamp,
            embedding: s.embedding.length > 0 ? s.embedding : undefined,
        }));
    }
    async clearSession(sessionId) {
        await this.prisma.conversationSession.deleteMany({
            where: { sessionId },
        });
    }
    async deleteOldSessions(beforeDate) {
        const result = await this.prisma.conversationSession.deleteMany({
            where: { timestamp: { lte: beforeDate } },
        });
        return result.count;
    }
    async getSessionCount(sessionId) {
        return this.prisma.conversationSession.count({
            where: { sessionId },
        });
    }
    async pruneOldTurns(sessionId, keepLast) {
        const count = await this.getSessionCount(sessionId);
        if (count <= keepLast)
            return;
        const oldest = await this.prisma.conversationSession.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            take: count - keepLast,
            select: { id: true },
        });
        await this.prisma.conversationSession.deleteMany({
            where: { id: { in: oldest.map((s) => s.id) } },
        });
    }
};
exports.ConversationSessionPrismaRepository = ConversationSessionPrismaRepository;
exports.ConversationSessionPrismaRepository = ConversationSessionPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversationSessionPrismaRepository);
//# sourceMappingURL=conversation-session-prisma.repository.js.map