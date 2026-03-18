"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jKnowledgeGraphService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const neo4j_driver_1 = require("neo4j-driver");
function isNoisyEntity(name, type) {
    const trimmed = name.trim();
    if (trimmed.length < 2)
        return true;
    if (trimmed.length > 60)
        return true;
    if (trimmed.includes('!') || trimmed.includes('?'))
        return true;
    if (!/\s/.test(trimmed) && (trimmed.includes('.') || trimmed.includes('_')))
        return true;
    if (/^\d+(\s+\S{1,5})?$/.test(trimmed))
        return true;
    if (type === 'concept' && /\d/.test(trimmed))
        return true;
    return false;
}
function transliterateCyrillic(text) {
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
        'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
        'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
        'ю': 'yu', 'я': 'ya', 'ё': 'yo', 'э': 'e', 'ъ': '', 'ы': 'y',
    };
    return text.toLowerCase().split('').map(c => map[c] ?? c).join('');
}
function buildCanonicalId(name, type) {
    const slug = transliterateCyrillic(name)
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    const safeType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${slug}_${safeType}`;
}
let Neo4jKnowledgeGraphService = class Neo4jKnowledgeGraphService {
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        this.isEnabled = true;
    }
    async onModuleInit() {
        const uri = this.configService.get('NEO4J_URI');
        const username = this.configService.get('NEO4J_USER');
        const password = this.configService.get('NEO4J_PASSWORD');
        if (!uri || !username || !password) {
            this.isEnabled = false;
            this.logger.warn('Neo4j disabled: missing config');
            return;
        }
        try {
            this.driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(username, password), {
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 30000,
            });
            await this.driver.verifyConnectivity();
            this.logger.log('Neo4j Aura connected');
        }
        catch (error) {
            this.isEnabled = false;
            this.logger.warn('Neo4j disabled (connection failed)', {
                error: error.message,
            });
        }
    }
    async onModuleDestroy() {
        if (this.driver && this.isEnabled) {
            await this.driver.close();
        }
    }
    async addEntity(entity) {
        if (!this.isEnabled)
            return;
        if (isNoisyEntity(entity.name, entity.type))
            return;
        const session = this.driver.session();
        try {
            await session.executeWrite(tx => tx.run(`
          MERGE (e:Entity {id: $id})
          SET e.name = $name, e.type = $type
          `, {
                id: buildCanonicalId(entity.name, entity.type),
                name: entity.name,
                type: entity.type,
            }));
        }
        catch (error) {
            this.logger.warn('Neo4j addEntity skipped', {
                error: error.message,
            });
        }
        finally {
            await session.close();
        }
    }
    async addRelationship(rel) {
        if (!this.isEnabled)
            return;
        const session = this.driver.session();
        try {
            await session.executeWrite(tx => tx.run(`
          MATCH (a:Entity {id: $from})
          MATCH (b:Entity {id: $to})
          MERGE (a)-[r:${rel.type}]->(b)
          `, {
                from: rel.fromEntityId,
                to: rel.toEntityId,
            }));
        }
        catch (error) {
            this.logger.warn('Neo4j addRelationship skipped', {
                error: error.message,
            });
        }
        finally {
            await session.close();
        }
    }
    async queryEntities(query) {
        if (!this.isEnabled)
            return [];
        const session = this.driver.session();
        try {
            const result = await session.executeRead(tx => tx.run(`
          MATCH (e:Entity)
          WHERE toLower(e.name) CONTAINS toLower($query)
          RETURN e LIMIT 25
          `, { query }));
            return result.records.map(r => {
                const e = r.get('e').properties;
                return {
                    id: e.id,
                    name: e.name,
                    type: e.type,
                    sourceDocument: '',
                };
            });
        }
        finally {
            await session.close();
        }
    }
    async getEntityById(id) {
        if (!this.isEnabled)
            return null;
        const session = this.driver.session();
        try {
            const result = await session.executeRead(tx => tx.run(`MATCH (e:Entity {id: $id}) RETURN e LIMIT 1`, { id }));
            if (!result.records.length)
                return null;
            const e = result.records[0].get('e').properties;
            return {
                id: e.id,
                name: e.name,
                type: e.type,
                sourceDocument: '',
            };
        }
        finally {
            await session.close();
        }
    }
    async getRelatedEntities(entityId, depth = 1) {
        if (!this.isEnabled)
            return [];
        const session = this.driver.session();
        try {
            const result = await session.executeRead(tx => tx.run(`
          MATCH (e:Entity {id: $id})-[*1..${depth}]-(related:Entity)
          RETURN DISTINCT related LIMIT 50
          `, { id: entityId }));
            return result.records.map(r => {
                const e = r.get('related').properties;
                return {
                    id: e.id,
                    name: e.name,
                    type: e.type,
                    sourceDocument: '',
                };
            });
        }
        finally {
            await session.close();
        }
    }
    async deleteEntity(id) {
        if (!this.isEnabled)
            return;
        const session = this.driver.session();
        try {
            await session.executeWrite(tx => tx.run(`
          MATCH (e:Entity {id: $id})
          DETACH DELETE e
          `, { id }));
        }
        finally {
            await session.close();
        }
    }
    async clearGraph() {
        if (!this.isEnabled)
            return;
        const session = this.driver.session();
        try {
            await session.executeWrite(tx => tx.run(`MATCH (n) DETACH DELETE n`));
        }
        finally {
            await session.close();
        }
    }
    async getGraphStats() {
        if (!this.isEnabled) {
            return {
                totalEntities: 0,
                totalRelationships: 0,
                entityTypes: {},
            };
        }
        const session = this.driver.session();
        try {
            const result = await session.executeRead(tx => tx.run(`
          MATCH (e:Entity)
          WITH count(e) as totalEntities
          MATCH ()-[r]->()
          WITH totalEntities, count(r) as totalRelationships
          MATCH (e:Entity)
          RETURN totalEntities, totalRelationships, e.type as type, count(*) as count
        `));
            const stats = {
                totalEntities: 0,
                totalRelationships: 0,
                entityTypes: {},
            };
            result.records.forEach(r => {
                stats.totalEntities = r.get('totalEntities').toNumber();
                stats.totalRelationships = r.get('totalRelationships').toNumber();
                stats.entityTypes[r.get('type')] = r.get('count').toNumber();
            });
            return stats;
        }
        finally {
            await session.close();
        }
    }
};
exports.Neo4jKnowledgeGraphService = Neo4jKnowledgeGraphService;
exports.Neo4jKnowledgeGraphService = Neo4jKnowledgeGraphService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], Neo4jKnowledgeGraphService);
//# sourceMappingURL=neo4j-knowledge-graph.service.js.map