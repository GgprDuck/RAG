import { Injectable, Inject } from '@nestjs/common';
import pLimit from 'p-limit';

import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';
import {
  IKnowledgeLink,
  IKnowledgeLinkRepository,
} from 'src/rag/domain/interfaces/knowledge-link.interface';
import {
  extractLinksFromMarkdown,
  isLinkQuery,
  isValidUrl,
} from '../utils/link-extractor.util';

export interface LinkSearchResult {
  found: boolean;
  links: IKnowledgeLink[];
  block?: string;
}

const LINK_STOP = new Set([
  // Ukrainian prepositions / conjunctions / question words
  'де', 'як', 'що', 'який', 'яка', 'яке', 'які', 'чи', 'у', 'в',
  'до', 'від', 'із', 'зі', 'та', 'і', 'й', 'або', 'але', 'при',
  'без', 'між', 'після', 'перед', 'над', 'під', 'через', 'для',
  'мені', 'мне', 'це', 'той', 'та', 'ті', 'цей', 'ця', 'ці',

  // Link-specific noise
  'посилання', 'лінк', 'лінка', 'сайт', 'знайти', 'відкрити',
  'where', 'find', 'give', 'what', 'is', 'the', 'a', 'an', 'of', 'for',
  'and', 'or', 'but', 'with', 'by', 'from', 'to', 'at', 'on', 'how',
  'url', 'link', 'me', 'my', 'can', 'you', 'please',
]);

const ABBR_VARIANTS: Record<string, string[]> = {
  // Network / IT
  vpn: ['впн', 'vpn'],
  впн: ['vpn', 'впн'],
  'вpн': ['vpn', 'впн'],
  ip: ['іп', 'ip'],
  іп: ['ip', 'іп'],
  'wi-fi': ['вайфай', 'wifi', 'wi-fi'],
  wifi: ['вайфай', 'wifi', 'wi-fi'],
  вайфай: ['wifi', 'wi-fi'],
  dns: ['днс', 'dns'],
  днс: ['dns', 'днс'],
  http: ['хттп', 'http'],
  https: ['хттпс', 'https'],
  ssl: ['ссл', 'ssl'],
  ссл: ['ssl', 'ссл'],

  // HR / tools
  hrm: ['хрм', 'hrm'],
  хрм: ['hrm', 'хрм'],
  crm: ['срм', 'crm'],
  срм: ['crm', 'срм'],
  erp: ['єрп', 'erp'],
  єрп: ['erp', 'єрп'],
  kpi: ['кпі', 'kpi'],
  кпі: ['kpi', 'кпі'],
  api: ['апі', 'api'],
  апі: ['api', 'апі'],
  ui: ['юай', 'ui'],
  юай: ['ui', 'юай'],
  ux: ['юекс', 'ux'],
  cv: ['резюме', 'cv'],
  резюме: ['cv'],
  підключ: ['підключення', 'підключитись'],
  підключення: ['підключ'],
  налашт: ['налаштування', 'налаштувати'],
  налаштування: ['налашт'],
  встанов: ['встановлення', 'встановити'],
  встановлення: ['встанов'],
  реєстр: ['реєстрація', 'зареєструватись'],
  реєстрація: ['реєстр'],
};

const MIN_SCORE_QUERY = 4;
const MIN_SCORE_CONTEXT = 0;

// Link health check config
const LINK_CHECK_TIMEOUT_MS = 5000;
const LINK_CHECK_CONCURRENCY = 5;

function expandVariants(word: string): string[] {
  const lower = word.toLowerCase();
  const variants = ABBR_VARIANTS[lower] ?? [];
  return [...new Set([lower, ...variants])];
}

function extractQueryKeywords(query: string): string[] {
  const base = query
    .toLowerCase()
    .replace(/[?!.,;:'"()[\]]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !LINK_STOP.has(w));

  const expanded = new Set<string>();
  for (const w of base) {
    for (const v of expandVariants(w)) {
      expanded.add(v);
    }
  }

  return [...expanded];
}

@Injectable()
export class LinkService {
  constructor(
    @Inject('IKnowledgeLinkRepository')
    private readonly repo: IKnowledgeLinkRepository,
    @Inject('LoggerPort')
    private readonly logger: LoggerPort,
  ) {}

  async indexLinksFromFiles(
    files: Array<{ originalname: string; buffer: Buffer }>,
  ): Promise<{ filesProcessed: number; linksIndexed: number }> {
    let linksIndexed = 0;

    for (const file of files) {
      if (!file.originalname.endsWith('.md')) continue;

      try {
        const content = file.buffer.toString('utf-8');
        const links = extractLinksFromMarkdown(content, file.originalname);

        if (!links.length) continue;

        await this.repo.deleteBySourceFile(file.originalname);

        const saved = await this.repo.upsertMany(links);

        this.logger.log('Links indexed', {
          file: file.originalname,
          count: saved,
          sample: links.slice(0, 3).map(l => `${l.label} → ${l.url}`),
        });

        linksIndexed += saved;
      } catch (err: any) {
        this.logger.warn('Link indexing failed for file', {
          file: file.originalname,
          error: err?.message,
        });
      }
    }

    return { filesProcessed: files.length, linksIndexed };
  }

  async findLinksForQuery(query: string): Promise<LinkSearchResult> {
    if (!isLinkQuery(query)) return { found: false, links: [] };

    const keywords = extractQueryKeywords(query);
    this.logger.log('LinkService: searching by query', { keywords });

    const raw = await this.repo.findByKeywords(keywords);

    const valid = this.filterValid(raw);
    const alive = await this.filterReachable(valid);
    const ranked = this.rankLinks(alive, query, keywords);

    const relevant = ranked.filter(
      l => this.linkScore(l, query.toLowerCase(), keywords) >= MIN_SCORE_QUERY,
    );

    this.logger.log('LinkService: query relevance filter', {
      before: ranked.length,
      after: relevant.length,
      threshold: MIN_SCORE_QUERY,
    });

    if (!relevant.length) return { found: true, links: [] };

    const block = this.formatLinksBlock(relevant);
    return { found: true, links: relevant, block };
  }

  async findLinksForContext(query: string): Promise<LinkSearchResult> {
    const keywords = extractQueryKeywords(query);
    if (!keywords.length) return { found: false, links: [] };

    this.logger.log('LinkService: context search', { keywords });

    const raw = await this.repo.findByKeywords(keywords);

    const valid = this.filterValid(raw);
    const alive = await this.filterReachable(valid);
    const ranked = this.rankLinks(alive, query, keywords);

    const relevant = ranked.filter(
      l => this.linkScore(l, query.toLowerCase(), keywords) >= MIN_SCORE_CONTEXT,
    );

    this.logger.log('LinkService: context relevance filter', {
      before: ranked.length,
      after: relevant.length,
      threshold: MIN_SCORE_CONTEXT,
    });

    if (!relevant.length) return { found: false, links: [] };

    const block = this.formatLinksBlock(relevant);
    return { found: true, links: relevant, block };
  }

  private filterValid(links: IKnowledgeLink[]): IKnowledgeLink[] {
    return links.filter(l => isValidUrl(l.url));
  }

  private async filterReachable(
    links: IKnowledgeLink[],
  ): Promise<IKnowledgeLink[]> {
    if (!links.length) return [];

    const limit = pLimit(LINK_CHECK_CONCURRENCY);

    const checks = await Promise.allSettled(
      links.map(link =>
        limit(async () => {
          const ok = await this.isReachable(link.url);
          return ok ? link : null;
        }),
      ),
    );

    return checks
      .filter(
        (r): r is PromiseFulfilledResult<IKnowledgeLink | null> =>
          r.status === 'fulfilled',
      )
      .map(r => r.value)
      .filter((v): v is IKnowledgeLink => v !== null);
  }

  /**
   * HEAD -> fallback GET
   */
  private async isReachable(
    url: string,
    timeoutMs = LINK_CHECK_TIMEOUT_MS,
  ): Promise<boolean> {
    if (!isValidUrl(url)) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // 1) Швидка перевірка HEAD
      const headRes = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
      });

      this.logger.log('Link HEAD check', {
        url,
        status: headRes.status,
        finalUrl: headRes.url,
      });

      if (this.isAllowedStatus(headRes.status)) {
        return true;
      }

      // 2) Fallback на GET (деякі сайти не люблять HEAD)
      const getRes = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 LinkChecker/1.0',
        },
      });

      this.logger.log('Link GET check', {
        url,
        status: getRes.status,
        finalUrl: getRes.url,
      });

      return this.isAllowedStatus(getRes.status);
    } catch (err: any) {
      this.logger.warn('Link check failed', {
        url,
        error: err?.message ?? String(err),
      });
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isAllowedStatus(status: number): boolean {
    return [200, 201, 202, 204, 301, 302, 307, 308].includes(status);
  }

  private linkScore(
    link: IKnowledgeLink,
    query: string,
    keywords: string[],
  ): number {
    let score = 0;

    const label = link.label.toLowerCase();
    const context = link.context.toLowerCase();
    const sourceFile = link.sourceFile.toLowerCase();

    if (query.includes(label)) score += 10;

    for (const kw of keywords) {
      if (link.keywords.some(k => k === kw || k.startsWith(kw))) score += 3;
      if (label.includes(kw)) score += 2;
      if (context.includes(kw)) score += 1;
      if (sourceFile.includes(kw)) score += 1;
    }

    if (link.linkType === 'image' && /фото|image|photo|зображ|скрин/i.test(query)) {
      score += 5;
    }

    if (link.linkType === 'video' && /відео|video|запис/i.test(query)) {
      score += 5;
    }

    return score;
  }

  private rankLinks(
    links: IKnowledgeLink[],
    query: string,
    keywords: string[],
  ): IKnowledgeLink[] {
    const q = query.toLowerCase();

    return [...links].sort(
      (a, b) => this.linkScore(b, q, keywords) - this.linkScore(a, q, keywords),
    );
  }

  private formatLinksBlock(links: IKnowledgeLink[]): string {
    if (!links.length) return '';

    return links
      .map(l => {
        return `${l.label}**: ${l.url}`;
      })
      .join('\n');
  }
}