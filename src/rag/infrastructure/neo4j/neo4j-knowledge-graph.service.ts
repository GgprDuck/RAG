import { Injectable, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import {
  IKnowledgeGraphPort,
  KnowledgeGraphEntity,
  KnowledgeGraphRelationship,
} from 'src/rag/domain/ports/knowledge-graph.port';

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
    'а': 'a','б': 'b','в': 'v','г': 'h','ґ': 'g','д': 'd','е': 'e','є': 'ye',
    'ж': 'zh','з': 'z','и': 'y','і': 'i','ї': 'yi','й': 'y','к': 'k','л': 'l',
    'м': 'm','н': 'n','о': 'o','п': 'p','р': 'r','с': 's','т': 't','у': 'u',
    'ф': 'f','х': 'kh','ц': 'ts','ч': 'ch','ш': 'sh','щ': 'shch','ь': '',
    'ю': 'yu','я': 'ya','ё': 'yo','э': 'e','ъ': '','ы': 'y',
  };
  return text.toLowerCase().split('').map(c => map[c] ?? c).join('');
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
  implements IKnowledgeGraphPort, OnModuleInit, OnModuleDestroy
{
  private driver: Driver;
  private isEnabled = true;

  constructor(
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async onModuleInit(): Promise<void> {
    const uri = this.configService.get<string>('NEO4J_URI');
    const username = this.configService.get<string>('NEO4J_USER');
    const password = this.configService.get<string>('NEO4J_PASSWORD');

    if (!uri || !username || !password) {
      this.isEnabled = false;
      this.logger.warn('Neo4j disabled: missing config');
      return;
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000,
      });

      await this.driver.verifyConnectivity();

      this.logger.log('Neo4j Aura connected');
    } catch (error) {
      this.isEnabled = false;
      this.logger.warn('Neo4j disabled (connection failed)', {
        error: (error as Error).message,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.driver && this.isEnabled) {
      await this.driver.close();
    }
  }

  async addEntity(entity: KnowledgeGraphEntity): Promise<void> {
    if (!this.isEnabled) return;
    if (isNoisyEntity(entity.name, entity.type)) return;

    const session = this.driver.session();

    try {
      await session.executeWrite(tx =>
        tx.run(
          `
          MERGE (e:Entity {id: $id})
          SET e.name = $name, e.type = $type
          `,
          {
            id: buildCanonicalId(entity.name, entity.type),
            name: entity.name,
            type: entity.type,
          },
        ),
      );
    } catch (error) {
      this.logger.warn('Neo4j addEntity skipped', {
        error: (error as Error).message,
      });
    } finally {
      await session.close();
    }
  }

  async addRelationship(rel: KnowledgeGraphRelationship): Promise<void> {
    if (!this.isEnabled) return;

    const session = this.driver.session();

    try {
      await session.executeWrite(tx =>
        tx.run(
          `
          MATCH (a:Entity {id: $from})
          MATCH (b:Entity {id: $to})
          MERGE (a)-[r:${rel.type}]->(b)
          `,
          {
            from: rel.fromEntityId,
            to: rel.toEntityId,
          },
        ),
      );
    } catch (error) {
      this.logger.warn('Neo4j addRelationship skipped', {
        error: (error as Error).message,
      });
    } finally {
      await session.close();
    }
  }

  async queryEntities(query: string): Promise<KnowledgeGraphEntity[]> {
    if (!this.isEnabled) return [];

    const session = this.driver.session();

    try {
      const result = await session.executeRead(tx =>
        tx.run(
          `
          MATCH (e:Entity)
          WHERE toLower(e.name) CONTAINS toLower($query)
          RETURN e LIMIT 25
          `,
          { query },
        ),
      );

      return result.records.map(r => {
        const e = r.get('e').properties;
        return {
          id: e.id,
          name: e.name,
          type: e.type,
          sourceDocument: '',
        };
      });
    } finally {
      await session.close();
    }
  }

  async getEntityById(id: string): Promise<KnowledgeGraphEntity | null> {
    if (!this.isEnabled) return null;

    const session = this.driver.session();

    try {
      const result = await session.executeRead(tx =>
        tx.run(`MATCH (e:Entity {id: $id}) RETURN e LIMIT 1`, { id }),
      );

      if (!result.records.length) return null;

      const e = result.records[0].get('e').properties;

      return {
        id: e.id,
        name: e.name,
        type: e.type,
        sourceDocument: '',
      };
    } finally {
      await session.close();
    }
  }

  async getRelatedEntities(entityId: string, depth = 1): Promise<KnowledgeGraphEntity[]> {
    if (!this.isEnabled) return [];

    const session = this.driver.session();

    try {
      const result = await session.executeRead(tx =>
        tx.run(
          `
          MATCH (e:Entity {id: $id})-[*1..${depth}]-(related:Entity)
          RETURN DISTINCT related LIMIT 50
          `,
          { id: entityId },
        ),
      );

      return result.records.map(r => {
        const e = r.get('related').properties;
        return {
          id: e.id,
          name: e.name,
          type: e.type,
          sourceDocument: '',
        };
      });
    } finally {
      await session.close();
    }
  }

  async deleteEntity(id: string): Promise<void> {
    if (!this.isEnabled) return;

    const session = this.driver.session();

    try {
      await session.executeWrite(tx =>
        tx.run(
          `
          MATCH (e:Entity {id: $id})
          DETACH DELETE e
          `,
          { id },
        ),
      );
    } finally {
      await session.close();
    }
  }

  async clearGraph(): Promise<void> {
    if (!this.isEnabled) return;

    const session = this.driver.session();

    try {
      await session.executeWrite(tx =>
        tx.run(`MATCH (n) DETACH DELETE n`),
      );
    } finally {
      await session.close();
    }
  }

  async getGraphStats(): Promise<any> {
    if (!this.isEnabled) {
      return {
        totalEntities: 0,
        totalRelationships: 0,
        entityTypes: {},
      };
    }

    const session = this.driver.session();

    try {
      const result = await session.executeRead(tx =>
        tx.run(`
          MATCH (e:Entity)
          WITH count(e) as totalEntities
          MATCH ()-[r]->()
          WITH totalEntities, count(r) as totalRelationships
          MATCH (e:Entity)
          RETURN totalEntities, totalRelationships, e.type as type, count(*) as count
        `),
      );

      const stats = {
        totalEntities: 0,
        totalRelationships: 0,
        entityTypes: {} as Record<string, number>,
      };

      result.records.forEach(r => {
        stats.totalEntities = r.get('totalEntities').toNumber();
        stats.totalRelationships = r.get('totalRelationships').toNumber();
        stats.entityTypes[r.get('type')] = r.get('count').toNumber();
      });

      return stats;
    } finally {
      await session.close();
    }
  }
}