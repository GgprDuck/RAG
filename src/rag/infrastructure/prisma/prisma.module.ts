import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConversationSessionPrismaRepository } from './repositories/conversation-session-prisma.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    ConversationSessionPrismaRepository,
    {
      provide: 'IConversationSessionRepository',
      useExisting: ConversationSessionPrismaRepository,
    },
  ],
  exports: [
    PrismaService,
    ConversationSessionPrismaRepository,
    'IConversationSessionRepository',
  ],
})
export class PrismaModule {}