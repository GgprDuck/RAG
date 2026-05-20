export interface ConversationTurn {
    query: string;
    answer: string;
    timestamp: Date;
    embedding?: number[];
}
export interface IConversationSessionRepository {
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
}
