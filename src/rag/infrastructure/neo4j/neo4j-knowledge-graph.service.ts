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
  private isEnabled = true;

  constructor(
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {}

  async onModuleInit(): Promise<void> {
    const uri      = this.configService.get<string>('NEO4J_URI', 'bolt://localhost:7687');
    const username = this.configService.get<string>('NEO4J_USER', 'neo4j');
    const password = this.configService.get<string>('NEO4J_PASSWORD', 'neo4jpassword');

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

      await this.driver.verifyConnectivity();
      await this.createIndexes();

      this.logger.log('Neo4j connected');
    } catch (error) {
      this.isEnabled = false; // ❗ вимикаємо сервіс
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

  private async createIndexes(): Promise<void> {
    if (!this.isEnabled) return;

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
    } catch {}
    finally {
      await session.close();
    }
  }

  async addEntity(entity: KnowledgeGraphEntity): Promise<void> {
    if (!this.isEnabled) return; // 👈 SKIP

    if (isNoisyEntity(entity.name, entity.type)) return;

    const session = this.driver.session();

    try {
      await session.run(
        `
        MERGE (e:Entity {id: $id})
        SET e.name = $name, e.type = $type
        `,
        {
          id: buildCanonicalId(entity.name, entity.type),
          name: entity.name,
          type: entity.type,
        },
      );
    } catch (error) {
      this.logger.warn('Neo4j addEntity skipped', {
        error: (error as Error).message,
      });
    } finally {
      await session.close();
    }
  }

  async addRelationship(): Promise<void> {
    if (!this.isEnabled) return; // 👈 SKIP
  }

  async queryEntities(): Promise<KnowledgeGraphEntity[]> {
    if (!this.isEnabled) return []; // 👈 SKIP

    return [];
  }

  async getEntityById(): Promise<KnowledgeGraphEntity | null> {
    if (!this.isEnabled) return null;
    return null;
  }

  async getRelatedEntities(): Promise<KnowledgeGraphEntity[]> {
    if (!this.isEnabled) return [];
    return [];
  }

  async deleteEntity(): Promise<void> {
    if (!this.isEnabled) return;
  }

  async clearGraph(): Promise<void> {
    if (!this.isEnabled) return;
  }

  async getGraphStats(): Promise<any> {
    if (!this.isEnabled) {
      return {
        totalEntities: 0,
        totalRelationships: 0,
        entityTypes: {},
      };
    }

    return {
      totalEntities: 0,
      totalRelationships: 0,
      entityTypes: {},
    };
  }
}