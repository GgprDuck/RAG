import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { DeleteImageCommand } from '../commands/delete-image.command';
import { IDeleteImage } from '../common/interfaces/image.interfaces';
import { ImageRagPort } from 'src/rag/domain/ports/image-rag.port';

@Injectable()
export class DeleteImageHandler {
  constructor(
    @Inject('ImageRagPort') private readonly imageRag: ImageRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(cmd: DeleteImageCommand): Promise<IDeleteImage> {
    if (!cmd.id || typeof cmd.id !== 'string' || !cmd.id.trim()) {
      this.logger.log('DeleteImage_Invalid', { id: cmd.id });
      throw new BadRequestException('A valid image ID must be provided.');
    }

    this.logger.log('DeleteImage', { id: cmd.id });
    return this.imageRag.deleteImageById(cmd.id);
  }
}
