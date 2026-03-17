import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { UploadFolderCommand } from '../commands/upload-folder.command';
import { TextRagPort } from 'src/rag/domain/ports/textRagPort';
export declare class UploadFolderHandler {
    private readonly textRag;
    private readonly logger;
    constructor(textRag: TextRagPort, logger: LoggerPort);
    execute(cmd: UploadFolderCommand): Promise<{
        totalChunks: number;
        filesProcessed: number;
    }>;
}
