import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { DeleteDocumentCommand } from '../commands/delete-document.command';
import { TextRagPort } from 'src/rag/domain/ports/textRagPort';
import { IDeleteDocument } from '../common/interfaces/rag-documents.interfaces';

@Injectable()
export class DeleteDocumentHandler {
  constructor(
    @Inject('TextRagPort') private readonly textRag: TextRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(cmd: DeleteDocumentCommand): Promise<IDeleteDocument> {
    if (!cmd.id || typeof cmd.id !== 'string' || !cmd.id.trim()) {
      this.logger.log('DeleteDocument_Invalid', { id: cmd.id });
      throw new BadRequestException('A valid document ID must be provided.');
    }

    this.logger.log('DeleteDocument', { id: cmd.id });
    return this.textRag.deleteById(cmd.id);
  }
}
