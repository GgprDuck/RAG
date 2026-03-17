import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { UploadKnowledgeCommand } from '../commands/upload-knowledge.command';
import { TextRagPort } from 'src/rag/domain/ports/textRagPort';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { IUploadKnowledge } from '../common/interfaces/rag-documents.interfaces';

@Injectable()
export class UploadKnowledgeHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(cmd: UploadKnowledgeCommand): Promise<IUploadKnowledge> {
    if (
      !cmd ||
      typeof cmd !== 'object' ||
      !cmd.file ||
      typeof cmd.file !== 'object' ||
      !cmd.file.originalname ||
      typeof cmd.file.originalname !== 'string' ||
      !cmd.file.originalname.trim()
    ) {
      this.logger.log('UploadKnowledge_Invalid', { file: cmd?.file });
      throw new BadRequestException('A valid file must be provided.');
    }

    const { chunkingStrategy, enableKnowledgeGraph } = cmd.options ?? {};

    this.logger.log('UploadKnowledge', {
      file: cmd.file.originalname,
      chunkingStrategy: chunkingStrategy ?? 'simple',
      enableKnowledgeGraph: enableKnowledgeGraph ?? false,
    });

    return this.textRag.uploadKnowledgeFromFile(cmd.file, {
      chunkingStrategy,
      enableKnowledgeGraph,
    });
  }
}