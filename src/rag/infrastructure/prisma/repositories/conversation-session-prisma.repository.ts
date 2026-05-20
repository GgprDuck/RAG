import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma.service';
import {
  IConversationSessionRepository,
  ConversationTurn,
} from 'src/rag/domain/ports/conversation-session.repository.port';
import { v4 as uuidv4 } from 'uuid';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

const HISTORY_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class ConversationSessionPrismaRepository
  implements IConversationSessionRepository
{
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async addTurn(
    sessionId: string,
    query: string,
    answer: string,
    embedding?: number[],
  ): Promise<void> {
    await this.prisma.conversationSession.create({
      data: {
        id:        uuidv4(),
        sessionId,
        query,
        answer,
        embedding: embedding ?? [],
        timestamp: new Date(),
      },
    });

    await this.pruneOldTurns(sessionId, 50);

    await this.bustSessionCache(sessionId);
  }

  async getHistory(sessionId: string, maxTurns = 5): Promise<ConversationTurn[]> {
    const cacheKey = `session:${sessionId}:history:${maxTurns}`;

    try {
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as Array<ConversationTurn>;
      }
    } catch (err: any) {
      this.logger.error('getHistory: Redis get failed', { error: err?.message });
      return [];
    }

    const sessions = await this.prisma.conversationSession.findMany({
      where:   { sessionId },
      orderBy: { timestamp: 'desc' },
      take:    maxTurns,
    });

    const turns: ConversationTurn[] = sessions
      .reverse()
      .map((s: { query: string; answer: string; timestamp: Date; embedding: number[] }) => ({
        query:     s.query,
        answer:    s.answer,
        timestamp: s.timestamp,
        embedding: s.embedding.length > 0 ? s.embedding : undefined,
      }));

    try {
      await this.redis.set(cacheKey, JSON.stringify(turns), 'EX', HISTORY_TTL_SECONDS);
    } catch {  }

    return turns;
  }

  async getTurns(
    sessionId: string,
    maxTurns = 100,
  ): Promise<Array<ConversationTurn & { id: string }>> {
    const sessions = await this.prisma.conversationSession.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      take: maxTurns,
      select: { id: true, query: true, answer: true, timestamp: true },
    });

    return sessions.map((s) => ({
      id: s.id,
      query: s.query,
      answer: s.answer,
      timestamp: s.timestamp,
    }));
  }

  async listSessionHeads(limit = 500): Promise<Array<{ sessionId: string; query: string; timestamp: Date }>> {
    const sessions = await this.prisma.conversationSession.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        sessionId: true,
        query: true,
        timestamp: true,
      },
    });

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      query: s.query,
      timestamp: s.timestamp,
    }));
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.prisma.conversationSession.deleteMany({ where: { sessionId } });
    await this.bustSessionCache(sessionId);
  }

  async clearAllSessions(): Promise<void> {
    await this.prisma.conversationSession.deleteMany({});
    try {
      const pattern = `rag:session:*`;
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch { }
  }

  async deleteOldSessions(beforeDate: Date): Promise<number> {
    const result = await this.prisma.conversationSession.deleteMany({
      where: { timestamp: { lte: beforeDate } },
    });
    return result.count;
  }

  async getSessionCount(sessionId: string): Promise<number> {
    return this.prisma.conversationSession.count({ where: { sessionId } });
  }

  private async pruneOldTurns(sessionId: string, keepLast: number): Promise<void> {
    const count = await this.getSessionCount(sessionId);
    if (count <= keepLast) return;

    const oldest = await this.prisma.conversationSession.findMany({
      where:   { sessionId },
      orderBy: { timestamp: 'asc' },
      take:    count - keepLast,
      select:  { id: true },
    });

    await this.prisma.conversationSession.deleteMany({
      where: { id: { in: oldest.map((s: { id: string }) => s.id) } },
    });
  }

  private async bustSessionCache(sessionId: string): Promise<void> {
    try {
      const pattern = `rag:session:${sessionId}:history:*`;
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 50);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch { }
  }
}