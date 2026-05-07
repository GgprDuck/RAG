import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerPort } from "../../shared/application/ports/logger.port";
import { IKnowledgeGraphPort, KnowledgeGraphEntity, KnowledgeGraphRelationship } from "../../domain/ports/knowledge-graph.port";
export declare class Neo4jKnowledgeGraphService implements IKnowledgeGraphPort, OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private driver;
    private isEnabled;
    constructor(configService: ConfigService, logger: LoggerPort);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    addEntity(entity: KnowledgeGraphEntity): Promise<void>;
    addRelationship(rel: KnowledgeGraphRelationship): Promise<void>;
    queryEntities(query: string): Promise<KnowledgeGraphEntity[]>;
    getEntityById(id: string): Promise<KnowledgeGraphEntity | null>;
    getRelatedEntities(entityId: string, depth?: number): Promise<KnowledgeGraphEntity[]>;
    deleteEntity(id: string): Promise<void>;
    clearGraph(): Promise<void>;
    getGraphStats(): Promise<any>;
}
