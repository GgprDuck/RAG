import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { ProcessImagesCommand } from '../commands/process-images.command';
import { IUploadImage } from '../common/interfaces/image.interfaces';
import { ImageRagPort } from 'src/rag/domain/ports/image-rag.port';

@Injectable()
export class ProcessImagesHandler {
  constructor(
    @Inject('ImageRagPort') private readonly imageRag: ImageRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(cmd: ProcessImagesCommand): Promise<IUploadImage> {
    if (
      !cmd ||
      typeof cmd !== 'object' ||
      !Array.isArray(cmd.files) ||
      cmd.files.length === 0
    ) {
      this.logger.log('ProcessImages_Invalid', { files: cmd?.files });
      throw new BadRequestException(
        'At least one valid image file must be provided.',
      );
    }

    this.logger.log('ProcessImages', { count: cmd.files.length });
    return this.imageRag.uploadImages(cmd.files);
  }
}
