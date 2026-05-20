import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommandBusPort } from '../../shared/application/ports/command-bus.port';
import { ProcessImagesCommand } from '../../application/commands/process-images.command';
import { DeleteImageCommand } from '../../application/commands/delete-image.command';
import {
  GetAllImagesQuery,
  GetImagesByKeywordQuery,
} from '../../application/queries/rag.queries';
import { ApiResponse } from '../api-response/api-response';
import { Meta } from '../api-response/meta';
import { IUploadImage, IImageWithScore, IImageWithoutScore, IDeleteImage } from 'src/rag/application/common/interfaces/image.interfaces';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('rag/images')
@UseGuards(ApiKeyGuard)
export class RagImagesController {
  constructor(
    @Inject('CommandBus') private readonly commandBus: CommandBusPort,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ApiResponse<IUploadImage>> {
    const result = await this.commandBus.execute<IUploadImage>(
      new ProcessImagesCommand(files),
    );
    return ApiResponse.success(
      result,
      new Meta({ message: `${result.imagesUploaded} images processed successfully` }),
    );
  }

  @Get('search')
  async searchImages(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<IImageWithScore[]>> {
    const results = await this.commandBus.execute<IImageWithScore[]>(
      new GetImagesByKeywordQuery(query, limit ? parseInt(limit, 10) : undefined),
    );
    return ApiResponse.success(
      results,
      new Meta({ message: `Found ${results.length} images` }),
    );
  }

  @Get()
  async getAllImages(
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<IImageWithoutScore[]>> {
    const images = await this.commandBus.execute<IImageWithoutScore[]>(
      new GetAllImagesQuery(limit ? parseInt(limit, 10) : undefined),
    );
    return ApiResponse.success(
      images,
      new Meta({ message: 'Images retrieved successfully', count: images.length }),
    );
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string): Promise<ApiResponse<IDeleteImage>> {
    const result = await this.commandBus.execute<IDeleteImage>(
      new DeleteImageCommand(id),
    );
    return ApiResponse.success(result, new Meta({ message: 'Image deleted successfully' }));
  }
}
