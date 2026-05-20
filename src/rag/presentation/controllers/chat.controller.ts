import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBusPort } from '../../shared/application/ports/command-bus.port';
import { ApiResponse } from '../api-response/api-response';
import { Meta } from '../api-response/meta';
import {
  ClearAllChatsCommand,
  DeleteChatCommand,
  GetChatQuery,
  ListChatsQuery,
} from '../../application/commands/chat-session.commands';
import { ApiKeyGuard } from '../guards/api-key.guard';

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

@Controller('rag/chats')
@UseGuards(ApiKeyGuard)
export class ChatController {
  constructor(
    @Inject('CommandBus') private readonly commandBus: CommandBusPort,
  ) {}

  @Get()
  async listChats(): Promise<ApiResponse<ChatSummary[]>> {
    const chats = await this.commandBus.execute<ChatSummary[]>(new ListChatsQuery());

    return ApiResponse.success(
      chats,
      new Meta({ message: 'Chats retrieved', count: chats.length }),
    );
  }

  @Get(':sessionId')
  async getChat(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<ChatDetail>> {
    const take = limit ? parseInt(limit, 10) : 100;
    const chat = await this.commandBus.execute<ChatDetail>(new GetChatQuery(sessionId, take));

    return ApiResponse.success(
      chat,
      new Meta({ message: 'Chat retrieved', count: chat.turns.length }),
    );
  }

  @Delete(':sessionId')
  async deleteChat(@Param('sessionId') sessionId: string): Promise<ApiResponse<null>> {
    await this.commandBus.execute(new DeleteChatCommand(sessionId));
    return ApiResponse.success(null, new Meta({ message: 'Chat deleted' }));
  }

  @Delete()
  async clearAllChats(): Promise<ApiResponse<null>> {
    await this.commandBus.execute(new ClearAllChatsCommand());
    return ApiResponse.success(null, new Meta({ message: 'All chats deleted' }));
  }
}