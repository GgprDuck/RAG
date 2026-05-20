import { CommandBusPort } from '../../shared/application/ports/command-bus.port';
import { ApiResponse } from '../api-response/api-response';
export interface ChatTurn {
    id: string;
    query: string;
    answer: string;
    timestamp: Date;
}
export interface ChatSummary {
    sessionId: string;
    firstMessage: string;
    lastActivity: Date;
    turnCount: number;
}
export interface ChatDetail {
    sessionId: string;
    turns: ChatTurn[];
}
export declare class ChatController {
    private readonly commandBus;
    constructor(commandBus: CommandBusPort);
    listChats(): Promise<ApiResponse<ChatSummary[]>>;
    getChat(sessionId: string, limit?: string): Promise<ApiResponse<ChatDetail>>;
    deleteChat(sessionId: string): Promise<ApiResponse<null>>;
    clearAllChats(): Promise<ApiResponse<null>>;
}
