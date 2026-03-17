import { Inject, Injectable } from '@nestjs/common';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { UploadFolderCommand } from '../commands/upload-folder.command';
import { TextRagPort } from 'src/rag/domain/ports/textRagPort';

@Injectable()
export class UploadFolderHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(
    cmd: UploadFolderCommand,
  ): Promise<{ totalChunks: number; filesProcessed: number }> {
    this.logger.log('UploadFolder', {
      files: cmd.files.length,
      strategy: cmd.options?.chunkingStrategy ?? 'simple',
    });

    return this.textRag.uploadMarkdownFolder(cmd.files, cmd.options);
  }
}
