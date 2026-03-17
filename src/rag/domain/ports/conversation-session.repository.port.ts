export interface ConversationTurn {
  query: string;
  answer: string;
  timestamp: Date;
  embedding?: number[];
}

export interface IConversationSessionRepository {
  addTurn(
    sessionId: string,
    query: string,
    answer: string,
    embedding?: number[],
  ): Promise<void>;
  getHistory(sessionId: string, maxTurns?: number): Promise<ConversationTurn[]>;
  clearSession(sessionId: string): Promise<void>;
  deleteOldSessions(beforeDate: Date): Promise<number>;
  getSessionCount(sessionId: string): Promise<number>;
}
