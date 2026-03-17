import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { TextRagPort } from 'src/rag/domain/ports/textRagPort';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { GetAllDocumentsCommand } from '../commands/get-all-documents.command';
import { IDocumentWithoutEmbedding } from '../common/interfaces/rag-documents.interfaces';

@Injectable()
export class GetAllDocumentsHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(
    _cmd: GetAllDocumentsCommand,
  ): Promise<Array<IDocumentWithoutEmbedding>> {
    if (!_cmd || typeof _cmd !== 'object') {
      this.logger.log('GetAllDocuments_Invalid', { cmd: _cmd });
      throw new BadRequestException('A valid command object must be provided.');
    }

    this.logger.log('GetAllDocuments', { action: 'execute' });
    return this.textRag.getAllDocuments();
  }
}
