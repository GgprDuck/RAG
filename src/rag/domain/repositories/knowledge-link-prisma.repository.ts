import { Injectable } from '@nestjs/common';
import {
  IKnowledgeLink,
  IKnowledgeLinkRepository,
  LinkType,
} from 'src/rag/domain/interfaces/knowledge-link.interface';
import { PrismaService } from 'src/rag/infrastructure/prisma/prisma.service';

@Injectable()
export class KnowledgeLinkPrismaRepository implements IKnowledgeLinkRepository {

  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(
    links: Omit<IKnowledgeLink, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<number> {
    if (!links.length) return 0;

    // Deduplicate by URL at the application level — fetch all currently stored
    // URLs and skip any that already exist (works regardless of DB schema constraints).
    const existingRows = await (this.prisma as any).knowledgeLink.findMany({
      select: { url: true },
    });
    const existingUrls = new Set<string>(existingRows.map((r: any) => r.url as string));

    const toCreate = links.filter(l => !existingUrls.has(l.url));
    if (!toCreate.length) return 0;

    let saved = 0;
    for (const link of toCreate) {
      try {
        await (this.prisma as any).knowledgeLink.create({
          data: {
            url:        link.url,
            label:      link.label,
            context:    link.context,
            sourceFile: link.sourceFile,
            linkType:   link.linkType,
            keywords:   link.keywords,
          },
        });
        saved++;
      } catch (err: any) {
        // Race condition or unexpected constraint — skip silently
      }
    }
    return saved;
  }

  /**
   * Searches by:
   *  - keywords array overlap  (GIN index)
   *  - label     ILIKE any keyword
   *  - context   ILIKE any keyword
   *  - sourceFile ILIKE any keyword
   *
   * Results are ranked by a relevance score and deduplicated by URL.
   */
  async findByKeywords(keywords: string[]): Promise<IKnowledgeLink[]> {
    if (!keywords.length) return [];

    const patterns = keywords.map(k => `%${k}%`);

    const rows = await (this.prisma as any).$queryRaw`
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

    return (rows as any[])
      .sort((a, b) => Number(b.relevance ?? 0) - Number(a.relevance ?? 0))
      .map(this.toInterface);
  }

  async findAll(): Promise<IKnowledgeLink[]> {
    const rows = await (this.prisma as any).knowledgeLink.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toInterface);
  }

  async deleteBySourceFile(sourceFile: string): Promise<void> {
    await (this.prisma as any).knowledgeLink.deleteMany({
      where: { sourceFile },
    });
  }

  private toInterface(row: any): IKnowledgeLink {
    return {
      id:         row.id,
      url:        row.url,
      label:      row.label,
      context:    row.context,
      sourceFile: row.sourceFile,
      linkType:   row.linkType as LinkType,
      keywords:   row.keywords ?? [],
      createdAt:  new Date(row.createdAt),
      updatedAt:  new Date(row.updatedAt),
    };
  }
}