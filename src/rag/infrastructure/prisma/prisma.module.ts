import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConversationSessionPrismaRepository } from './repositories/conversation-session-prisma.repository';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';
import { AnswerFeedbackPrismaRepository } from './repositories/answer-feedback-prisma.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    ConversationSessionPrismaRepository,
    AnswerFeedbackPrismaRepository,
    {
      provide: 'IConversationSessionRepository',
      useExisting: ConversationSessionPrismaRepository,
    },
    {
      provide: 'LoggerPort',
      useClass: ConsoleLoggerAdapter,
    },
    {
      provide: 'IAnswerFeedbackRepository',
      useExisting: AnswerFeedbackPrismaRepository,
    },
  ],
  exports: [
    PrismaService,
    ConversationSessionPrismaRepository,
    AnswerFeedbackPrismaRepository,
    'IConversationSessionRepository',
    'IAnswerFeedbackRepository',
  ],
})
export class PrismaModule {}