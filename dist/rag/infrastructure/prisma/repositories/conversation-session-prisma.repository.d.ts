import Redis from 'ioredis';
import { PrismaService } from '../prisma.service';
import { IConversationSessionRepository, ConversationTurn } from "../../../domain/ports/conversation-session.repository.port";
import { LoggerPort } from "../../../shared/application/ports/logger.port";
export declare class ConversationSessionPrismaRepository implements IConversationSessionRepository {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: Redis, logger: LoggerPort);
    addTurn(sessionId: string, query: string, answer: string, embedding?: number[]): Promise<void>;
    getHistory(sessionId: string, maxTurns?: number): Promise<ConversationTurn[]>;
    getTurns(sessionId: string, maxTurns?: number): Promise<Array<ConversationTurn & {
        id: string;
    }>>;
    listSessionHeads(limit?: number): Promise<Array<{
        sessionId: string;
        query: string;
        timestamp: Date;
    }>>;
    clearSession(sessionId: string): Promise<void>;
    clearAllSessions(): Promise<void>;
    deleteOldSessions(beforeDate: Date): Promise<number>;
    getSessionCount(sessionId: string): Promise<number>;
    private pruneOldTurns;
    private bustSessionCache;
}
