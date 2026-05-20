import { IKnowledgeLink } from '../../domain/interfaces/knowledge-link.interface';
import { CommandBusPort } from "../../shared/application/ports/command-bus.port";
export interface GetAllLinksResponse {
    total: number;
    links: IKnowledgeLink[];
}
export interface SearchLinksResponse {
    query: string;
    total: number;
    links: IKnowledgeLink[];
    block?: string;
}
export interface DeleteLinksResponse {
    sourceFile: string;
    deleted: boolean;
}
export interface IndexLinksResponse {
    filesProcessed: number;
    linksIndexed: number;
}
export declare class LinksController {
    private readonly commandBus;
    constructor(commandBus: CommandBusPort);
    getAllLinks(sourceFile?: string): Promise<GetAllLinksResponse>;
    searchLinks(q?: string): Promise<SearchLinksResponse>;
    queryLinks(q?: string): Promise<SearchLinksResponse>;
    deleteBySourceFile(sourceFile: string): Promise<DeleteLinksResponse>;
    indexLinks(files: Express.Multer.File[]): Promise<IndexLinksResponse>;
}
