import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OllamaService } from './ollama.service';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';
import { CacheModule } from '../redis/cache.module';

@Module({
  imports: [
    ConfigModule,
    CacheModule,
  ],
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
