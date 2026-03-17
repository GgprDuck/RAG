import { Injectable, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

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
  getGraphStats(): Promise<{ totalEntities: number; totalRelationships: number; entityTypes: Record<string, number> }>;
  addEntity(entity: KnowledgeGraphEntity): Promise<void>;
  addRelationship(relationship: KnowledgeGraphRelationship): Promise<void>;
  queryEntities(query: string): Promise<KnowledgeGraphEntity[]>;
  getEntityById(id: string): Promise<KnowledgeGraphEntity | null>;
  getRelatedEntities(entityId: string, depth?: number): Promise<KnowledgeGraphEntity[]>;
  deleteEntity(id: string): Promise<void>;
  clearGraph(): Promise<void>;
}

function isNoisyEntity(name: string, type: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  if (trimmed.length > 60) return true;
  if (trimmed.includes('!') || trimmed.includes('?')) return true;
  if (!/\s/.test(trimmed) && (trimmed.includes('.') || trimmed.includes('_'))) return true;
  if (/^\d+(\s+\S{1,5})?$/.test(trimmed)) return true;
  if (type === 'concept' && /\d/.test(trimmed)) return true;
  return false;
}

function transliterateCyrillic(text: string): string {
  const map: Record<string, string> = {
    'а': 'a',  'б': 'b',  'в': 'v',  'г': 'h',  'ґ': 'g',
    'д': 'd',  'е': 'e',  'є': 'ye', 'ж': 'zh', 'з': 'z',
    'и': 'y',  'і': 'i',  'ї': 'yi', 'й': 'y',  'к': 'k',
    'л': 'l',  'м': 'm',  'н': 'n',  'о': 'o',  'п': 'p',
    'р': 'r',  'с': 's',  'т': 't',  'у': 'u',  'ф': 'f',
    'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ь': '',   'ю': 'yu', 'я': 'ya',
    'ё': 'yo', 'э': 'e',  'ъ': '',   'ы': 'y',
  };
  return text
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('');
}

function buildCanonicalId(name: string, type: string): string {
  const slug = transliterateCyrillic(name)
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const safeType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${slug}_${safeType}`;
}

@Injectable()
export class Neo4jKnowledgeGraphService
  implements IKnowledgeGraphService, OnModuleInit, OnModuleDestroy
{
  private driver: Driver;

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const uri      = this.configService.get<string>('NEO4J_URI',      'bolt://localhost:7687');
    const username = this.configService.get<string>('NEO4J_USER',     'neo4j');
    const password = this.configService.get<string>('NEO4J_PASSWORD', 'neo4jpassword');
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    try {
      await this.driver.verifyConnectivity();
      await this.createIndexes();
    } catch (error) {
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.driver) await this.driver.close();
  }

  private async createIndexes(): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(
        'CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE',
      );
      await session.run(
        'CREATE INDEX entity_name_index IF NOT EXISTS FOR (e:Entity) ON (e.name)',
      );
      await session.run(
        'CREATE INDEX entity_type_index IF NOT EXISTS FOR (e:Entity) ON (e.type)',
      );
      await session.run(`
        CREATE FULLTEXT INDEX entity_fulltext IF NOT EXISTS
        FOR (e:Entity) ON EACH [e.name, e.nameLower]
      `);
    } catch (error) {
    } finally {
      await session.close();
    }
  }

  async addEntity(entity: KnowledgeGraphEntity): Promise<void> {
    if (isNoisyEntity(entity.name, entity.type)) {
      return;
    }
    const canonicalId = buildCanonicalId(entity.name, entity.type);
    const nameLower   = entity.name.toLowerCase();
    const propertiesJson = entity.properties
      ? JSON.stringify(entity.properties)
      : null;
    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (e:Entity {id: $canonicalId})
        ON CREATE SET
          e.name           = $name,
          e.nameLower      = $nameLower,
          e.type           = $type,
          e.sourceDocument = $sourceDocument,
          e.sourceDocuments = [$sourceDocument],
          e.aliases        = [$name],
          e.createdAt      = datetime(),
          e.updatedAt      = datetime()
        ON MATCH SET
          e.updatedAt       = datetime(),
          e.sourceDocuments = CASE
            WHEN $sourceDocument IN e.sourceDocuments
            THEN e.sourceDocuments
            ELSE e.sourceDocuments + [$sourceDocument]
          END,
          e.aliases = CASE
            WHEN $name IN e.aliases
            THEN e.aliases
            ELSE e.aliases + [$name]
          END
        ` +
        (propertiesJson ? ' SET e.propertiesJson = $propertiesJson' : ''),
        {
          canonicalId,
          name:          entity.name,
          nameLower,
          type:          entity.type,
          sourceDocument: entity.sourceDocument,
          ...(propertiesJson && { propertiesJson }),
        },
      );
    } catch (error) {
      throw error;
    } finally {
      await session.close();
    }
  }

  async addRelationship(relationship: KnowledgeGraphRelationship): Promise<void> {
    const relType = sanitizeRelType(relationship.type);
    const propertiesJson = relationship.properties
      ? JSON.stringify(relationship.properties)
      : null;
    const session = this.driver.session();
    try {
      const query = `
        MATCH (from:Entity {id: $fromId})
        MATCH (to:Entity {id: $toId})
        MERGE (from)-[r:${relType} {id: $id}]->(to)
        SET r.updatedAt = datetime()
        ${propertiesJson ? ', r.propertiesJson = $propertiesJson' : ''}
      `;
      await session.run(query, {
        id:     relationship.id,
        fromId: relationship.fromEntityId,
        toId:   relationship.toEntityId,
        ...(propertiesJson && { propertiesJson }),
      });
    } catch (error) {
    } finally {
      await session.close();
    }
  }

  async queryEntities(query: string): Promise<KnowledgeGraphEntity[]> {
    const session = this.driver.session();
    try {
      try {
        const ftResult = await session.run(
          `
          CALL db.index.fulltext.queryNodes("entity_fulltext", $query)
          YIELD node, score
          WHERE score > 0.3
          RETURN node as e
          ORDER BY score DESC
          LIMIT 15
          `,
          { query: this.buildFulltextQuery(query) },
        );
        if (ftResult.records.length > 0) {
          return ftResult.records.map((r) => this.recordToEntity(r.get('e').properties));
        }
      } catch {}
      const fallbackResult = await session.run(
        `
        MATCH (e:Entity)
        WHERE toLower(e.name) CONTAINS $q
           OR toLower(e.type) CONTAINS $q
        RETURN e
        LIMIT 15
        `,
        { q: query.toLowerCase() },
      );
      return fallbackResult.records.map((r) =>
        this.recordToEntity(r.get('e').properties),
      );
    } finally {
      await session.close();
    }
  }

  async getEntityById(id: string): Promise<KnowledgeGraphEntity | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (e:Entity {id: $id}) RETURN e',
        { id },
      );
      if (result.records.length === 0) return null;
      return this.recordToEntity(result.records[0].get('e').properties);
    } finally {
      await session.close();
    }
  }

  async getRelatedEntities(
    entityId: string,
    depth: number = 2,
  ): Promise<KnowledgeGraphEntity[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (start:Entity {id: $entityId})-[r*1..${Math.min(depth, 3)}]-(related:Entity)
        RETURN DISTINCT related, [rel in r | type(rel)] as relTypes
        LIMIT 25
        `,
        { entityId },
      );
      return result.records.map((record) => {
        const props    = record.get('related').properties;
        const relTypes = record.get('relTypes') as string[];
        return {
          ...this.recordToEntity(props),
          properties: { ...this.deserializeProperties(props.propertiesJson), relTypes },
        };
      });
    } finally {
      await session.close();
    }
  }

  async deleteEntity(id: string): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run('MATCH (e:Entity {id: $id}) DETACH DELETE e', { id });
    } finally {
      await session.close();
    }
  }

  async clearGraph(): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
  }

  async getGraphStats(): Promise<{
    totalEntities: number;
    totalRelationships: number;
    entityTypes: Record<string, number>;
  }> {
    const session = this.driver.session();
    try {
      const [entResult, relResult, typeResult] = await Promise.all([
        session.run('MATCH (e:Entity) RETURN count(e) as count'),
        session.run('MATCH ()-[r]->() RETURN count(r) as count'),
        session.run('MATCH (e:Entity) RETURN e.type as type, count(e) as count'),
      ]);
      const entityTypes: Record<string, number> = {};
      typeResult.records.forEach((r) => {
        entityTypes[r.get('type') as string] = (r.get('count'))?.toNumber?.() ?? 0;
      });
      return {
        totalEntities:     (entResult.records[0].get('count'))?.toNumber?.() ?? 0,
        totalRelationships:(relResult.records[0].get('count'))?.toNumber?.() ?? 0,
        entityTypes,
      };
    } finally {
      await session.close();
    }
  }

  async findPath(
    fromEntityId: string,
    toEntityId: string,
  ): Promise<KnowledgeGraphEntity[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH path = shortestPath(
          (from:Entity {id: $fromEntityId})-[*]-(to:Entity {id: $toEntityId})
        )
        RETURN nodes(path) as entities
        `,
        { fromEntityId, toEntityId },
      );
      if (result.records.length === 0) return [];
      return (result.records[0].get('entities') as any[]).map((node) =>
        this.recordToEntity(node.properties),
      );
    } finally {
      await session.close();
    }
  }

  async getEntitiesByType(
    type: string,
    limit: number = 20,
  ): Promise<KnowledgeGraphEntity[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (e:Entity {type: $type}) RETURN e LIMIT $limit',
        { type, limit: neo4j.int(limit) },
      );
      return result.records.map((r) => this.recordToEntity(r.get('e').properties));
    } finally {
      await session.close();
    }
  }

  private recordToEntity(props: Record<string, any>): KnowledgeGraphEntity {
    return {
      id:             props.id,
      name:           props.name,
      type:           props.type,
      sourceDocument: props.sourceDocument,
      properties:     this.deserializeProperties(props.propertiesJson),
    };
  }

  private deserializeProperties(json: string | null): Record<string, any> {
    if (!json) return {};
    try { return JSON.parse(json); } catch { return {}; }
  }

  private buildFulltextQuery(query: string): string {
    const escaped = query.replace(/[+\-&|!(){}[\]^"~*?:\\]/g, '\\$&');
    const words = escaped.trim().split(/\s+/);
    if (words.length === 1) return `${words[0]}~`;
    return words.map((w) => `${w}~`).join(' ');
  }
}

const ALLOWED_REL_TYPES = new Set([
  'WORKS_ON', 'MEMBER_OF', 'LOCATED_IN', 'USES', 'MANAGES',
  'PART_OF', 'CREATED_BY', 'MENTIONED_WITH', 'RELATES_TO',
]);

function sanitizeRelType(type: string): string {
  const upper = type.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
  return ALLOWED_REL_TYPES.has(upper) ? upper : 'RELATES_TO';
}