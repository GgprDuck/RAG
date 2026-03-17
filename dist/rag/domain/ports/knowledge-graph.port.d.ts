export interface KnowledgeGraphEntity {
    id: string;
    name: string;
    type: string;
    sourceDocument: string;
    properties?: Record<string, unknown>;
}
export interface KnowledgeGraphRelationship {
    id: string;
    fromEntityId: string;
    toEntityId: string;
    type: string;
    properties?: Record<string, unknown>;
}
export interface IKnowledgeGraphPort {
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
