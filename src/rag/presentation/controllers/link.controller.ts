import {
    Controller,
    Get,
    Delete,
    Query,
    Param,
    HttpCode,
    HttpStatus,
    BadRequestException,
    Inject,
    Post,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
  } from '@nestjs/common';
  import { IKnowledgeLink } from '../../domain/interfaces/knowledge-link.interface';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { memoryStorage } from 'multer';
  import { CommandBusPort } from 'src/rag/shared/application/ports/command-bus.port';
  import {
    DeleteLinksBySourceFileCommand,
    GetAllLinksQuery,
    IndexLinksFilesCommand,
    QueryLinksQuery,
    SearchLinksQuery,
  } from 'src/rag/application/commands/link.commands';
  import { ApiKeyGuard } from '../guards/api-key.guard';
  
  export interface GetAllLinksResponse {
    total: number;
    links: IKnowledgeLink[];
  }
  
  export interface SearchLinksResponse {
    query:  string;
    total:  number;
    links:  IKnowledgeLink[];
    block?: string;
  }
  
  export interface DeleteLinksResponse {
    sourceFile: string;
    deleted:    boolean;
  }
  
  export interface IndexLinksResponse {
    filesProcessed: number;
    linksIndexed:   number;
  }
  
  const mdFilesInterceptor = () =>
    FilesInterceptor('files', 10_000, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        cb(null, name.endsWith('.md') || name.endsWith('.markdown'));
      },
    });
  
  @Controller('links')
  @UseGuards(ApiKeyGuard)
  export class LinksController {
    constructor(
      @Inject('CommandBus') private readonly commandBus: CommandBusPort,
    ) {}
  
    @Get()
    async getAllLinks(
      @Query('sourceFile') sourceFile?: string,
    ): Promise<GetAllLinksResponse> {
      return this.commandBus.execute<GetAllLinksResponse>(new GetAllLinksQuery(sourceFile));
    }
  
    @Get('search')
    async searchLinks(
      @Query('q') q?: string,
    ): Promise<SearchLinksResponse> {
      if (!q) throw new BadRequestException('Query param "q" is required');
      return this.commandBus.execute<SearchLinksResponse>(new SearchLinksQuery(q));
    }
  
    @Get('query')
    async queryLinks(
      @Query('q') q?: string,
    ): Promise<SearchLinksResponse> {
      if (!q) throw new BadRequestException('Query param "q" is required');
      return this.commandBus.execute<SearchLinksResponse>(new QueryLinksQuery(q));
    }
  
    @Delete(':sourceFile')
    @HttpCode(HttpStatus.OK)
    async deleteBySourceFile(
      @Param('sourceFile') sourceFile: string,
    ): Promise<DeleteLinksResponse> {
      return this.commandBus.execute<DeleteLinksResponse>(
        new DeleteLinksBySourceFileCommand(sourceFile),
      );
    }
  
    @Post('index-links')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(mdFilesInterceptor())
    async indexLinks(
      @UploadedFiles() files: Express.Multer.File[],
    ): Promise<IndexLinksResponse> {
      if (!files || files.length === 0) {
        throw new BadRequestException(
          'No .md files received. Send files under the "files" multipart field.',
        );
      }
  
      
      
      
      const normalizedFiles = files.map((file) => ({
        ...file,
        originalname: file.originalname
          .replace(/\\/g, '/')
          .replace(/^\/+/, ''),
      }));
  
      return this.commandBus.execute<IndexLinksResponse>(
        new IndexLinksFilesCommand(normalizedFiles),
      );
    }
  }