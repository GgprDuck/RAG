import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface KnowledgeGraphEntity {
    id: string;
    name: string;
    type: string;
    sourceDocument: string;
    properties?: Record<string, any>;
}
export interface KnowledgeGraphRelationship {
    id: string;
    fromEntityId: string;
    toEntityId: string;
    type: string;
    properties?: Record<string, any>;
}
export interface IKnowledgeGraphService {
    getGraphStats(): Promise<{
        totalEntities: number;
        totalRelationships: number;
        entityTypes: Record<string, number>;
    }>;
    addEntity(entity: KnowledgeGraphEntity): Promise<void>;
    addRelationship(relationship: KnowledgeGraphRelationship): Promise<void>;
    queryEntities(query: string): Promise<KnowledgeGraphEntity[]>;
    getEntityById(id: string): Promise<KnowledgeGraphEntity | null>;
    getRelatedEntities(entityId: string, depth?: number): Promise<KnowledgeGraphEntity[]>;
    deleteEntity(id: string): Promise<void>;
    clearGraph(): Promise<void>;
}
export declare class Neo4jKnowledgeGraphService implements IKnowledgeGraphService, OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private driver;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private createIndexes;
    addEntity(entity: KnowledgeGraphEntity): Promise<void>;
    addRelationship(relationship: KnowledgeGraphRelationship): Promise<void>;
    queryEntities(query: string): Promise<KnowledgeGraphEntity[]>;
    getEntityById(id: string): Promise<KnowledgeGraphEntity | null>;
    getRelatedEntities(entityId: string, depth?: number): Promise<KnowledgeGraphEntity[]>;
    deleteEntity(id: string): Promise<void>;
    clearGraph(): Promise<void>;
    getGraphStats(): Promise<{
        totalEntities: number;
        totalRelationships: number;
        entityTypes: Record<string, number>;
    }>;
    findPath(fromEntityId: string, toEntityId: string): Promise<KnowledgeGraphEntity[]>;
    getEntitiesByType(type: string, limit?: number): Promise<KnowledgeGraphEntity[]>;
    private recordToEntity;
    private deserializeProperties;
    private buildFulltextQuery;
}
