import { IKnowledgeLink } from 'src/rag/domain/interfaces/knowledge-link.interface';

export class GetAllLinksQuery {
  constructor(public readonly sourceFile?: string) {}
}

export class SearchLinksQuery {
  constructor(public readonly query: string) {}
}

export class QueryLinksQuery {
  constructor(public readonly query: string) {}
}

export class DeleteLinksBySourceFileCommand {
  constructor(public readonly sourceFile: string) {}
}

export class IndexLinksFilesCommand {
  constructor(public readonly files: Express.Multer.File[]) {}
}

export interface LinksSearchReadModel {
  query: string;
  total: number;
  links: IKnowledgeLink[];
  block?: string;
}
