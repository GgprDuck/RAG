import { Inject, Injectable } from '@nestjs/common';
import { IConversationSessionRepository } from 'src/rag/domain/ports/conversation-session.repository.port';
import {
  ClearAllChatsCommand,
  DeleteChatCommand,
  GetChatQuery,
  ListChatsQuery,
} from '../commands/chat-session.commands';

export interface ChatTurnReadModel {
  id: string;
  query: string;
  answer: string;
  timestamp: Date;
}

export interface ChatSummaryReadModel {
  sessionId: string;
  firstMessage: string;
  lastActivity: Date;
  turnCount: number;
}

@Injectable()
export class ListChatsHandler {
  constructor(
    @Inject('IConversationSessionRepository')
    private readonly conversationRepository: IConversationSessionRepository,
  ) {}

  async execute(query: ListChatsQuery): Promise<ChatSummaryReadModel[]> {
    const rows = await this.conversationRepository.listSessionHeads(query.limit ?? 500);
    const map = new Map<string, { firstQuery: string; lastActivity: Date; count: number }>();

    for (const row of rows) {
      if (!map.has(row.sessionId)) {
        map.set(row.sessionId, {
          firstQuery: row.query,
          lastActivity: row.timestamp,
          count: 1,
        });
      } else {
        map.get(row.sessionId)!.count++;
      }
    }

    return [...map.entries()].map(([sessionId, data]) => ({
      sessionId,
      firstMessage: data.firstQuery.slice(0, 60) + (data.firstQuery.length > 60 ? '…' : ''),
      lastActivity: data.lastActivity,
      turnCount: data.count,
    }));
  }
}

@Injectable()
export class GetChatHandler {
  constructor(
    @Inject('IConversationSessionRepository')
    private readonly conversationRepository: IConversationSessionRepository,
  ) {}

  async execute(query: GetChatQuery): Promise<{ sessionId: string; turns: ChatTurnReadModel[] }> {
    const turns = await this.conversationRepository.getTurns(query.sessionId, query.limit ?? 100);
    return { sessionId: query.sessionId, turns };
  }
}

@Injectable()
export class DeleteChatHandler {
  constructor(
    @Inject('IConversationSessionRepository')
    private readonly conversationRepository: IConversationSessionRepository,
  ) {}

  async execute(command: DeleteChatCommand): Promise<void> {
    await this.conversationRepository.clearSession(command.sessionId);
  }
}

@Injectable()
export class ClearAllChatsHandler {
  constructor(
    @Inject('IConversationSessionRepository')
    private readonly conversationRepository: IConversationSessionRepository,
  ) {}

  async execute(_command: ClearAllChatsCommand): Promise<void> {
    await this.conversationRepository.clearAllSessions();
  }
}
