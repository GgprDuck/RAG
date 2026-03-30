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
exports.LinkService = void 0;
const common_1 = require("@nestjs/common");
const p_limit_1 = require("p-limit");
const link_extractor_util_1 = require("../utils/link-extractor.util");
const LINK_STOP = new Set([
    'де', 'як', 'що', 'який', 'яка', 'яке', 'які', 'чи', 'у', 'в',
    'до', 'від', 'із', 'зі', 'та', 'і', 'й', 'або', 'але', 'при',
    'без', 'між', 'після', 'перед', 'над', 'під', 'через', 'для',
    'мені', 'мне', 'це', 'той', 'та', 'ті', 'цей', 'ця', 'ці',
    'посилання', 'лінк', 'лінка', 'сайт', 'знайти', 'відкрити',
    'where', 'find', 'give', 'what', 'is', 'the', 'a', 'an', 'of', 'for',
    'and', 'or', 'but', 'with', 'by', 'from', 'to', 'at', 'on', 'how',
    'url', 'link', 'me', 'my', 'can', 'you', 'please',
]);
const ABBR_VARIANTS = {
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
const LINK_CHECK_TIMEOUT_MS = 5000;
const LINK_CHECK_CONCURRENCY = 5;
function expandVariants(word) {
    const lower = word.toLowerCase();
    const variants = ABBR_VARIANTS[lower] ?? [];
    return [...new Set([lower, ...variants])];
}
function extractQueryKeywords(query) {
    const base = query
        .toLowerCase()
        .replace(/[?!.,;:'"()[\]]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && !LINK_STOP.has(w));
    const expanded = new Set();
    for (const w of base) {
        for (const v of expandVariants(w)) {
            expanded.add(v);
        }
    }
    return [...expanded];
}
let LinkService = class LinkService {
    constructor(repo, logger) {
        this.repo = repo;
        this.logger = logger;
    }
    async indexLinksFromFiles(files) {
        let linksIndexed = 0;
        for (const file of files) {
            if (!file.originalname.endsWith('.md'))
                continue;
            try {
                const content = file.buffer.toString('utf-8');
                const links = (0, link_extractor_util_1.extractLinksFromMarkdown)(content, file.originalname);
                if (!links.length)
                    continue;
                await this.repo.deleteBySourceFile(file.originalname);
                const saved = await this.repo.upsertMany(links);
                this.logger.log('Links indexed', {
                    file: file.originalname,
                    count: saved,
                    sample: links.slice(0, 3).map(l => `${l.label} → ${l.url}`),
                });
                linksIndexed += saved;
            }
            catch (err) {
                this.logger.warn('Link indexing failed for file', {
                    file: file.originalname,
                    error: err?.message,
                });
            }
        }
        return { filesProcessed: files.length, linksIndexed };
    }
    async findLinksForQuery(query) {
        if (!(0, link_extractor_util_1.isLinkQuery)(query))
            return { found: false, links: [] };
        const keywords = extractQueryKeywords(query);
        this.logger.log('LinkService: searching by query', { keywords });
        const raw = await this.repo.findByKeywords(keywords);
        const valid = this.filterValid(raw);
        const alive = await this.filterReachable(valid);
        const ranked = this.rankLinks(alive, query, keywords);
        const relevant = ranked.filter(l => this.linkScore(l, query.toLowerCase(), keywords) >= MIN_SCORE_QUERY);
        this.logger.log('LinkService: query relevance filter', {
            before: ranked.length,
            after: relevant.length,
            threshold: MIN_SCORE_QUERY,
        });
        if (!relevant.length)
            return { found: true, links: [] };
        const block = this.formatLinksBlock(relevant);
        return { found: true, links: relevant, block };
    }
    async findLinksForContext(query) {
        const keywords = extractQueryKeywords(query);
        if (!keywords.length)
            return { found: false, links: [] };
        this.logger.log('LinkService: context search', { keywords });
        const raw = await this.repo.findByKeywords(keywords);
        const valid = this.filterValid(raw);
        const alive = await this.filterReachable(valid);
        const ranked = this.rankLinks(alive, query, keywords);
        const relevant = ranked.filter(l => this.linkScore(l, query.toLowerCase(), keywords) >= MIN_SCORE_CONTEXT);
        this.logger.log('LinkService: context relevance filter', {
            before: ranked.length,
            after: relevant.length,
            threshold: MIN_SCORE_CONTEXT,
        });
        if (!relevant.length)
            return { found: false, links: [] };
        const block = this.formatLinksBlock(relevant);
        return { found: true, links: relevant, block };
    }
    filterValid(links) {
        return links.filter(l => (0, link_extractor_util_1.isValidUrl)(l.url));
    }
    async filterReachable(links) {
        if (!links.length)
            return [];
        const limit = (0, p_limit_1.default)(LINK_CHECK_CONCURRENCY);
        const checks = await Promise.allSettled(links.map(link => limit(async () => {
            const ok = await this.isReachable(link.url);
            return ok ? link : null;
        })));
        return checks
            .filter((r) => r.status === 'fulfilled')
            .map(r => r.value)
            .filter((v) => v !== null);
    }
    async isReachable(url, timeoutMs = LINK_CHECK_TIMEOUT_MS) {
        if (!(0, link_extractor_util_1.isValidUrl)(url))
            return false;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
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
        }
        catch (err) {
            this.logger.warn('Link check failed', {
                url,
                error: err?.message ?? String(err),
            });
            return false;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    isAllowedStatus(status) {
        return [200, 201, 202, 204, 301, 302, 307, 308].includes(status);
    }
    linkScore(link, query, keywords) {
        let score = 0;
        const label = link.label.toLowerCase();
        const context = link.context.toLowerCase();
        const sourceFile = link.sourceFile.toLowerCase();
        if (query.includes(label))
            score += 10;
        for (const kw of keywords) {
            if (link.keywords.some(k => k === kw || k.startsWith(kw)))
                score += 3;
            if (label.includes(kw))
                score += 2;
            if (context.includes(kw))
                score += 1;
            if (sourceFile.includes(kw))
                score += 1;
        }
        if (link.linkType === 'image' && /фото|image|photo|зображ|скрин/i.test(query)) {
            score += 5;
        }
        if (link.linkType === 'video' && /відео|video|запис/i.test(query)) {
            score += 5;
        }
        return score;
    }
    rankLinks(links, query, keywords) {
        const q = query.toLowerCase();
        return [...links].sort((a, b) => this.linkScore(b, q, keywords) - this.linkScore(a, q, keywords));
    }
    formatLinksBlock(links) {
        if (!links.length)
            return '';
        return links
            .map(l => {
            return `${l.label}**: ${l.url}`;
        })
            .join('\n');
    }
};
exports.LinkService = LinkService;
exports.LinkService = LinkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IKnowledgeLinkRepository')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], LinkService);
//# sourceMappingURL=link.service.js.map