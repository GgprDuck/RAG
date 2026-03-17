import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import { GetImagesByKeywordCommand } from '../commands/get-images-by-keyword.command';
import { IImageWithScore } from '../common/interfaces/image.interfaces';
import { ImageRagPort } from 'src/rag/domain/ports/image-rag.port';

@Injectable()
export class GetImagesByKeywordHandler {
  constructor(
    @Inject('ImageRagPort') private readonly imageRag: ImageRagPort,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(
    cmd: GetImagesByKeywordCommand,
  ): Promise<Array<IImageWithScore>> {
    if (
      !cmd.keyword ||
      typeof cmd.keyword !== 'string' ||
      !cmd.keyword.trim()
    ) {
      this.logger.log('GetImagesByKeyword_InvalidKeyword', {
        keyword: cmd.keyword,
      });
      throw new BadRequestException('A valid keyword must be provided.');
    }
    if (
      cmd.limit !== undefined &&
      (typeof cmd.limit !== 'number' ||
        isNaN(cmd.limit) ||
        !isFinite(cmd.limit) ||
        cmd.limit <= 0)
    ) {
      this.logger.log('GetImagesByKeyword_InvalidLimit', { limit: cmd.limit });
      throw new BadRequestException('A valid limit must be a positive number.');
    }

    this.logger.log('GetImagesByKeyword', {
      keyword: cmd.keyword,
      limit: cmd.limit,
    });
    return this.imageRag.getImagesByKeyword(cmd.keyword, cmd.limit);
  }
}
