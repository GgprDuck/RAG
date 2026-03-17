import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OllamaService } from './ollama.service';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    OllamaService,
    {
      provide: 'LoggerPort',
      useClass: ConsoleLoggerAdapter,
    },
  ],
  exports: [OllamaService],
})
export class OllamaModule {}
