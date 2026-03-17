import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { ProcessImagesCommand } from '../commands/process-images.command';
import { IUploadImage } from '../common/interfaces/image.interfaces';
import { ImageRagPort } from 'src/rag/domain/ports/image-rag.port';
export declare class ProcessImagesHandler {
    private readonly imageRag;
    private readonly logger;
    constructor(imageRag: ImageRagPort, logger: LoggerPort);
    execute(cmd: ProcessImagesCommand): Promise<IUploadImage>;
}
