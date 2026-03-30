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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeLinkPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
let KnowledgeLinkPrismaRepository = class KnowledgeLinkPrismaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsertMany(links) {
        if (!links.length)
            return 0;
        const existingRows = await this.prisma.knowledgeLink.findMany({
            select: { url: true },
        });
        const existingUrls = new Set(existingRows.map((r) => r.url));
        const toCreate = links.filter(l => !existingUrls.has(l.url));
        if (!toCreate.length)
            return 0;
        let saved = 0;
        for (const link of toCreate) {
            try {
                await this.prisma.knowledgeLink.create({
                    data: {
                        url: link.url,
                        label: link.label,
                        context: link.context,
                        sourceFile: link.sourceFile,
                        linkType: link.linkType,
                        keywords: link.keywords,
                    },
                });
                saved++;
            }
            catch (err) {
            }
        }
        return saved;
    }
    async findByKeywords(keywords) {
        if (!keywords.length)
            return [];
        const patterns = keywords.map(k => `%${k}%`);
        const rows = await this.prisma.$queryRaw `
      SELECT DISTINCT ON (url)
        *,
        (
          CASE WHEN keywords && ${keywords}::text[] THEN 2 ELSE 0 END +
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest(${patterns}::text[]) AS p WHERE label ILIKE p
          ) THEN 1 ELSE 0 END +
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest(${patterns}::text[]) AS p WHERE context ILIKE p
          ) THEN 1 ELSE 0 END +
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest(${patterns}::text[]) AS p WHERE "sourceFile" ILIKE p
          ) THEN 1 ELSE 0 END
        ) AS relevance
      FROM knowledge_links
      WHERE
        keywords && ${keywords}::text[]
        OR EXISTS (
          SELECT 1 FROM unnest(${patterns}::text[]) AS p
          WHERE label ILIKE p OR context ILIKE p OR "sourceFile" ILIKE p
        )
      ORDER BY url, relevance DESC, "created_at" DESC
      LIMIT 30
    `;
        return rows
            .sort((a, b) => Number(b.relevance ?? 0) - Number(a.relevance ?? 0))
            .map(this.toInterface);
    }
    async findAll() {
        const rows = await this.prisma.knowledgeLink.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(this.toInterface);
    }
    async deleteBySourceFile(sourceFile) {
        await this.prisma.knowledgeLink.deleteMany({
            where: { sourceFile },
        });
    }
    toInterface(row) {
        return {
            id: row.id,
            url: row.url,
            label: row.label,
            context: row.context,
            sourceFile: row.sourceFile,
            linkType: row.linkType,
            keywords: row.keywords ?? [],
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }
};
exports.KnowledgeLinkPrismaRepository = KnowledgeLinkPrismaRepository;
exports.KnowledgeLinkPrismaRepository = KnowledgeLinkPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeLinkPrismaRepository);
//# sourceMappingURL=knowledge-link-prisma.repository.js.map