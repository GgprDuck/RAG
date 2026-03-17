import { TextRagPort } from 'src/rag/domain/ports/textRagPort';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { GetAllDocumentsCommand } from '../commands/get-all-documents.command';
import { IDocumentWithoutEmbedding } from '../common/interfaces/rag-documents.interfaces';
export declare class GetAllDocumentsHandler {
    private readonly textRag;
    private readonly logger;
    constructor(textRag: TextRagPort, logger: LoggerPort);
    execute(_cmd: GetAllDocumentsCommand): Promise<Array<IDocumentWithoutEmbedding>>;
}
