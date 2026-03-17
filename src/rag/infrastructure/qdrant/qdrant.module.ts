import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagQdrantService } from './rag-qdrant.service';
import { QdrantImageDocumentRepository } from './repositories/qdrant-image-document.repository';
import { QdrantTextDocumentRepository } from './repositories/qdrant-text-document.repository';
import { OllamaModule } from '../ollama/ollama.module';
import { S3Module } from '../s3/s3.module';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';

@Module({
  imports: [ConfigModule, OllamaModule, S3Module],
  providers: [
    RagQdrantService,
    QdrantImageDocumentRepository,
    QdrantTextDocumentRepository,
    {
      provide: 'ITextDocumentRepository',
      useExisting: QdrantTextDocumentRepository,
    },
    {
      provide: 'IImageDocumentRepository',
      useExisting: QdrantImageDocumentRepository,
    },
    {
      provide: 'LoggerPort',
      useClass: ConsoleLoggerAdapter,
    },
  ],
  exports: [
    RagQdrantService,
    QdrantTextDocumentRepository,
    QdrantImageDocumentRepository,
  ],
})
export class QdrantModule {}
