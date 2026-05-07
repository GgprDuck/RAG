import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConversationSessionPrismaRepository } from './repositories/conversation-session-prisma.repository';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';

@Global()
@Module({
  providers: [
    PrismaService,
    ConversationSessionPrismaRepository,
    {
      provide: 'IConversationSessionRepository',
      useExisting: ConversationSessionPrismaRepository,
    },
    {
      provide: 'LoggerPort',
      useClass: ConsoleLoggerAdapter,
    },
  ],
  exports: [
    PrismaService,
    ConversationSessionPrismaRepository,
    'IConversationSessionRepository',
  ],
})
export class PrismaModule {}