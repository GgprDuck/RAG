import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageService } from './s3.storage.service';
import { ConsoleLoggerAdapter } from 'src/rag/shared/application/ports/console.logger.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    S3StorageService,
    {
      provide: 'LoggerPort',
      useClass: ConsoleLoggerAdapter,
    },
  ],
  exports: [S3StorageService],
})
export class S3Module {}
