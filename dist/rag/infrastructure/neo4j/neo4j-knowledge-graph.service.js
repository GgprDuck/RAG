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
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g',
        'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
        'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k',
        'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
        'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
        'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ь': '', 'ю': 'yu', 'я': 'ya',
        'ё': 'yo', 'э': 'e', 'ъ': '', 'ы': 'y',
    };
    return text
        .toLowerCase()
        .split('')
        .map((c) => map[c] ?? c)
        .join('');
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
        const uri = this.configService.get('NEO4J_URI', 'bolt://localhost:7687');
        const username = this.configService.get('NEO4J_USER', 'neo4j');
        const password = this.configService.get('NEO4J_PASSWORD', 'neo4jpassword');
        try {
            this.driver = neo4j_driver_1.default.driver(uri, neo4j_driver_1.default.auth.basic(username, password));
            await this.driver.verifyConnectivity();
            await this.createIndexes();
            this.logger.log('Neo4j connected');
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
    async createIndexes() {
        if (!this.isEnabled)
            return;
        const session = this.driver.session();
        try {
            await session.run('CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE');
            await session.run('CREATE INDEX entity_name_index IF NOT EXISTS FOR (e:Entity) ON (e.name)');
            await session.run('CREATE INDEX entity_type_index IF NOT EXISTS FOR (e:Entity) ON (e.type)');
        }
        catch { }
        finally {
            await session.close();
        }
    }
    async addEntity(entity) {
        if (!this.isEnabled)
            return;
        if (isNoisyEntity(entity.name, entity.type))
            return;
        const session = this.driver.session();
        try {
            await session.run(`
        MERGE (e:Entity {id: $id})
        SET e.name = $name, e.type = $type
        `, {
                id: buildCanonicalId(entity.name, entity.type),
                name: entity.name,
                type: entity.type,
            });
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
    async addRelationship() {
        if (!this.isEnabled)
            return;
    }
    async queryEntities() {
        if (!this.isEnabled)
            return [];
        return [];
    }
    async getEntityById() {
        if (!this.isEnabled)
            return null;
        return null;
    }
    async getRelatedEntities() {
        if (!this.isEnabled)
            return [];
        return [];
    }
    async deleteEntity() {
        if (!this.isEnabled)
            return;
    }
    async clearGraph() {
        if (!this.isEnabled)
            return;
    }
    async getGraphStats() {
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
};
exports.Neo4jKnowledgeGraphService = Neo4jKnowledgeGraphService;
exports.Neo4jKnowledgeGraphService = Neo4jKnowledgeGraphService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], Neo4jKnowledgeGraphService);
//# sourceMappingURL=neo4j-knowledge-graph.service.js.map