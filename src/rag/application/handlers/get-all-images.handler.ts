import { Inject, Injectable } from '@nestjs/common';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { IImageWithoutScore } from '../common/interfaces/image.interfaces';
import { ImageRagPort } from 'src/rag/domain/ports/image-rag.port';
import { GetAllImagesCommand } from '../commands/get-all-images.command';

@Injectable()
export class GetAllImagesHandler {
  constructor(
    @Inject('ImageRagPort') private readonly imageRag: ImageRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(cmd: GetAllImagesCommand): Promise<Array<IImageWithoutScore>> {
    this.logger.log('GetAllImages', { limit: cmd.limit });

    const documents = await this.imageRag.getAllImages();

    return documents.map((doc) => ({
      id: doc.id,
      s3Url: doc.s3Url,
      mimeType: doc.mimeType,
      description: doc.description,
      keywords: doc.keywords,
      createdAt: doc.createdAt,
      model: doc.model,
    }));
  }
}
