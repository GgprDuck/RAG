import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LinkService } from '../services/link.service';
import { IKnowledgeLinkRepository } from 'src/rag/domain/interfaces/knowledge-link.interface';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import {
  DeleteLinksBySourceFileCommand,
  GetAllLinksQuery,
  IndexLinksFilesCommand,
  QueryLinksQuery,
  SearchLinksQuery,
} from '../commands/link.commands';
import { ExtractLinksHandler } from './extract-links.handler';
import { IndexLinksCommand } from '../commands/extract-links.command';

@Injectable()
export class GetAllLinksHandler {
  constructor(
    @Inject('IKnowledgeLinkRepository')
    private readonly repo: IKnowledgeLinkRepository,
  ) {}

  async execute(query: GetAllLinksQuery) {
    let links = await this.repo.findAll();
    if (query.sourceFile) {
      links = links.filter((l) => l.sourceFile === query.sourceFile);
    }
    return { total: links.length, links };
  }
}

@Injectable()
export class SearchLinksHandler {
  constructor(
    private readonly linkService: LinkService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(query: SearchLinksQuery) {
    if (!query.query?.trim()) {
      throw new BadRequestException('Query param "q" is required');
    }
    const result = await this.linkService.findLinksForContext(query.query.trim());
    this.logger.log('SearchLinksHandler', { query: query.query, found: result.found, total: result.links.length });
    return {
      query: query.query.trim(),
      total: result.links.length,
      links: result.links,
      block: result.block,
    };
  }
}

@Injectable()
export class QueryLinksHandler {
  constructor(
    private readonly linkService: LinkService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async execute(query: QueryLinksQuery) {
    if (!query.query?.trim()) {
      throw new BadRequestException('Query param "q" is required');
    }
    const result = await this.linkService.findLinksForQuery(query.query.trim());
    if (!result.found) {
      throw new NotFoundException(
        'Query does not appear to be link-related. Use /links/search for keyword lookup.',
      );
    }
    this.logger.log('QueryLinksHandler', { query: query.query, total: result.links.length });
    return {
      query: query.query.trim(),
      total: result.links.length,
      links: result.links,
      block: result.block,
    };
  }
}

@Injectable()
export class DeleteLinksBySourceFileHandler {
  constructor(
    @Inject('IKnowledgeLinkRepository')
    private readonly repo: IKnowledgeLinkRepository,
  ) {}

  async execute(command: DeleteLinksBySourceFileCommand) {
    if (!command.sourceFile?.trim()) {
      throw new BadRequestException('sourceFile param is required');
    }
    await this.repo.deleteBySourceFile(command.sourceFile.trim());
    return { sourceFile: command.sourceFile.trim(), deleted: true };
  }
}

@Injectable()
export class IndexLinksFilesHandler {
  constructor(private readonly extractLinksHandler: ExtractLinksHandler) {}

  async execute(command: IndexLinksFilesCommand) {
    return this.extractLinksHandler.execute(new IndexLinksCommand(command.files));
  }
}
