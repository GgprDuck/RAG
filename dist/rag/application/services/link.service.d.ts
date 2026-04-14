import { LoggerPort } from "../../shared/application/ports/logger.port";
import { IKnowledgeLink, IKnowledgeLinkRepository } from "../../domain/interfaces/knowledge-link.interface";
import { CachePort } from "../../domain/ports/cache.port";
import Redis from 'ioredis';
export interface LinkSearchResult {
    found: boolean;
    links: IKnowledgeLink[];
    block?: string;
}
export declare class LinkService {
    private readonly repo;
    private readonly logger;
    private readonly cache;
    private readonly redis;
    constructor(repo: IKnowledgeLinkRepository, logger: LoggerPort, cache: CachePort, redis: Redis);
    indexLinksFromFiles(files: Array<{
        originalname: string;
        buffer: Buffer;
    }>): Promise<{
        filesProcessed: number;
        linksIndexed: number;
    }>;
    findLinksForQuery(query: string): Promise<LinkSearchResult>;
    findLinksForContext(query: string): Promise<LinkSearchResult>;
    private filterValid;
    private filterReachable;
    private isReachable;
    private isAllowedStatus;
    private linkScore;
    private rankLinks;
    private formatLinksBlock;
    private redisGet;
    private redisSet;
    private bustLinkCache;
}
