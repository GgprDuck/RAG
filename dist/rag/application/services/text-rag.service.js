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
exports.TextRagService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("@upstash/redis");
const uuid_1 = require("uuid");
const text_document_entity_1 = require("../../domain/entities/text-document.entity");
const embedding_vo_1 = require("../../domain/value-objects/embedding.vo");
const text_chunk_util_1 = require("../utils/text-chunk.util");
const embedding_util_1 = require("../utils/embedding.util");
const file_text_util_1 = require("../utils/file-text.util");
const answer_grounding_policy_1 = require("../policies/answer-grounding.policy");
const score_histogram_util_1 = require("../utils/score-histogram.util");
const rerank_strategy_util_1 = require("../utils/rerank-strategy.util");
const rag_cache_service_1 = require("./rag-cache.service");
const rag_ingest_service_1 = require("./rag-ingest.service");
const prompt_injection_guard_1 = require("../guards/prompt-injection.guard");
const advanced_chunking_util_1 = require("../utils/advanced-chunking.util");
const query_transformer_util_1 = require("../utils/query-transformer.util");
const reranker_util_1 = require("../utils/reranker.util");
const hybrid_search_util_1 = require("../utils/hybrid-search.util");
const contextual_compression_util_1 = require("../utils/contextual-compression.util");
const transliteration_util_1 = require("../utils/transliteration.util");
const query_classefire_util_1 = require("../utils/query-classefire.util");
const link_service_1 = require("./link.service");
const MIN_CHUNK_TEXT_LENGTH = 80;
const UPLOAD_CONCURRENCY = 3;
const EMBED_BATCH_SIZE = 10;
const MAX_CONTEXT_CHARS = 6000;
const KEYWORD_STOP_WORDS = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'and', 'or', 'but', 'how', 'when',
    'where', 'who', 'which', 'does', 'do', 'did', 'has', 'have', 'had',
    'can', 'could', 'would', 'should', 'will', 'be', 'been', 'being',
    'this', 'that', 'these', 'those', 'it', 'its', 'tell', 'me', 'about',
    'що', 'як', 'де', 'коли', 'хто', 'чому', 'який', 'яка', 'яке', 'які',
    'чи', 'або', 'та', 'це', 'є', 'у', 'в', 'на', 'до', 'по', 'про', 'за',
]);
function reciprocalRankFusion(allResults, k) {
    const rrfScores = new Map();
    for (const results of allResults) {
        const sorted = [...results].sort((a, b) => b.score - a.score);
        sorted.forEach((r, rank) => {
            rrfScores.set(r.id, (rrfScores.get(r.id) ?? 0) + 1 / (k + rank + 1));
        });
    }
    return rrfScores;
}
let TextRagService = class TextRagService {
    constructor(vectorSearch, ragSettings, textRepository, conversationRepository, knowledgeGraph, logger, confidencePort, embeddingPort, chatLlmPort, linkService, ragContextFormatting, redis, cache, ragCache, ragIngest, tracing) {
        this.vectorSearch = vectorSearch;
        this.ragSettings = ragSettings;
        this.textRepository = textRepository;
        this.conversationRepository = conversationRepository;
        this.knowledgeGraph = knowledgeGraph;
        this.logger = logger;
        this.confidencePort = confidencePort;
        this.embeddingPort = embeddingPort;
        this.chatLlmPort = chatLlmPort;
        this.linkService = linkService;
        this.ragContextFormatting = ragContextFormatting;
        this.redis = redis;
        this.cache = cache;
        this.ragCache = ragCache;
        this.ragIngest = ragIngest;
        this.tracing = tracing;
        this.queryTransformer = new query_transformer_util_1.QueryTransformer(this.chatLlmPort, this.redis);
        this.reranker = new reranker_util_1.Reranker(this.chatLlmPort, this.embeddingPort);
        this.hybridSearch = new hybrid_search_util_1.HybridSearchEngine(this.vectorSearch, this.logger);
        this.contextualCompressor = new contextual_compression_util_1.ContextualCompressor(this.embeddingPort, this.chatLlmPort);
        this.queryClassifier = new query_classefire_util_1.QueryClassifier(this.chatLlmPort);
    }
    async uploadKnowledgeFromFile(file, options) {
        const { ollamaEmbedModelText: embedModel } = this.ragSettings.get();
        const { chunkingStrategy = 'simple', enableKnowledgeGraph = false, } = options || {};
        const text = await (0, file_text_util_1.extractFileText)(file);
        const rawText = file.buffer.toString('utf-8');
        const keywords = await this.prepareKeywordsForFile(text, file.originalname, rawText);
        this.logger.log('Processing file', { name: file.originalname, strategy: chunkingStrategy });
        let savedCount = 0;
        if (chunkingStrategy === 'semantic') {
            savedCount = await this.uploadWithSemantic(text, embedModel, keywords);
        }
        else if (chunkingStrategy === 'parent-child') {
            savedCount = await this.uploadWithParentChild(file, text, embedModel, options);
        }
        else {
            savedCount = await this.uploadWithSimple(text, embedModel, keywords);
        }
        this.logger.log(`Saved ${savedCount} documents to vector store`);
        await this.ragCache.invalidateAnswerCache();
        if (enableKnowledgeGraph) {
            this.logger.log('Extracting knowledge graph...');
            await this.extractKnowledgeGraph(text, file.originalname);
        }
        return { chunks: savedCount };
    }
    async uploadMarkdownFolder(files, options) {
        let totalChunks = 0;
        let filesProcessed = 0;
        let filesFailed = 0;
        for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
            const batch = files.slice(i, i + UPLOAD_CONCURRENCY);
            const results = await Promise.allSettled(batch.map(file => this.uploadKnowledgeFromFile(file, options)));
            for (let j = 0; j < results.length; j++) {
                const res = results[j];
                const file = batch[j];
                if (res.status === 'fulfilled') {
                    this.logger.log('File processed', { name: file.originalname, chunks: res.value.chunks });
                    totalChunks += res.value.chunks;
                    filesProcessed++;
                }
                else {
                    this.logger.error(`Failed to process ${file.originalname}`, res.reason);
                    filesFailed++;
                }
            }
        }
        if (filesFailed > 0) {
            this.logger.warn('uploadMarkdownFolder: some files failed', {
                filesProcessed,
                filesFailed,
                total: files.length,
            });
        }
        return { totalChunks, filesProcessed };
    }
    async uploadWithSimple(text, embedModel, keywords = []) {
        const rawChunks = (0, text_chunk_util_1.chunkTextBySentences)(text, { minWords: 20, maxWords: 150 });
        const chunks = rawChunks.filter(t => t.trim().length >= MIN_CHUNK_TEXT_LENGTH);
        this.logger.log(`Generated ${chunks.length} simple chunks (after min-length filter)`);
        const chunkMeta = await Promise.all(chunks.map(chunk => this.prepareKeywordsForChunk(chunk, keywords).then(kws => ({ keywords: kws }))));
        return this.ragIngest.embedAndSaveChunks(chunks, embedModel, 100, [], chunkMeta);
    }
    async uploadWithSemantic(text, embedModel, keywords = []) {
        const semanticChunks = await (0, advanced_chunking_util_1.semanticChunking)(text, this.embeddingPort, {
            minChunkSize: 100,
            maxChunkSize: 500,
        });
        const validSemantic = semanticChunks.filter(c => c.text.trim().length >= MIN_CHUNK_TEXT_LENGTH);
        const chunks = validSemantic.map(c => c.text);
        this.logger.log(`Generated ${chunks.length} semantic chunks (after min-length filter)`);
        const chunkMeta = await Promise.all(validSemantic.map(chunk => this.prepareKeywordsForChunk(chunk.text, keywords, chunk.metadata.sectionHeader).then(kws => ({
            keywords: kws,
            sectionTitle: chunk.metadata.sectionHeader,
        }))));
        return this.ragIngest.embedAndSaveChunks(chunks, embedModel, 100, [], chunkMeta);
    }
    async uploadWithParentChild(file, text, embedModel, options) {
        const { textRagVectorSize: vectorSize } = this.ragSettings.get();
        const pcOpts = options?.parentChild ?? {};
        const fileId = this.buildFileId(file.originalname);
        const rawText = file.buffer.toString('utf-8');
        const keywords = await this.prepareKeywordsForFile(text, file.originalname, rawText);
        this.logger.log(`Keywords ready for ${file.originalname}`, {
            total: keywords.length,
            sample: keywords.slice(0, 12),
        });
        const collectedParents = [];
        const collectedChildren = [];
        await (0, advanced_chunking_util_1.parentChildChunking)(text, async (chunk) => {
            if (chunk.metadata.level === 0) {
                collectedParents.push(chunk);
            }
            else {
                collectedChildren.push(chunk);
            }
        }, {
            parentSize: pcOpts.parentSize ?? 4000,
            childSize: pcOpts.childSize ?? 1200,
            overlap: pcOpts.overlap ?? 150,
            storeParentText: pcOpts.storeParentText ?? true,
            useMarkdownHeaders: pcOpts.useMarkdownHeaders ?? true,
            fileId,
        });
        if (collectedParents.length > 0) {
            const parentDocs = collectedParents.map(chunk => text_document_entity_1.TextDocument.create(chunk.metadata.chunkId, chunk.text, new Array(vectorSize).fill(0), embedModel, new Date(), chunk.metadata.chunkId, 0, chunk.metadata.startIndex, chunk.metadata.endIndex, chunk.metadata.childIds, undefined, undefined, keywords));
            await this.textRepository.saveMany(parentDocs);
            this.logger.log(`Saved ${parentDocs.length} parent blocks`);
        }
        const validChildren = collectedChildren.filter(chunk => {
            const hasUrl = /https?:\/\/\S+|\b[\w-]+\.[\w-]+\.\w{2,}\b/.test(chunk.text);
            if (chunk.text.trim().length < MIN_CHUNK_TEXT_LENGTH && !hasUrl) {
                this.logger.log(`Skipping micro-chunk (${chunk.text.trim().length} chars): "${chunk.text.trim().slice(0, 60)}"`);
                return false;
            }
            return true;
        });
        let savedCount = 0;
        const childKeywordMeta = await Promise.all(validChildren.map(chunk => this.prepareKeywordsForChunk(chunk.text, keywords, chunk.metadata.sectionHeader).then(kws => ({
            keywords: kws,
            sectionTitle: chunk.metadata.sectionHeader,
        }))));
        for (let i = 0; i < validChildren.length; i += EMBED_BATCH_SIZE) {
            const batch = validChildren.slice(i, i + EMBED_BATCH_SIZE);
            const embeddings = await Promise.all(batch.map(c => this.embeddingPort.embed(c.text)));
            const docs = batch.map((chunk, idx) => {
                const globalIdx = i + idx;
                const meta = childKeywordMeta[globalIdx];
                return text_document_entity_1.TextDocument.create((0, uuid_1.v4)(), chunk.text, (0, embedding_util_1.extractEmbedding)(embeddings[idx]), embedModel, new Date(), chunk.metadata.chunkId, chunk.metadata.level, chunk.metadata.startIndex, chunk.metadata.endIndex, chunk.metadata.childIds, chunk.metadata.parentId, chunk.metadata.parentText, meta.keywords, meta.sectionTitle);
            });
            await this.textRepository.saveMany(docs);
            savedCount += docs.length;
        }
        this.logger.log(`Saved ${savedCount} child chunks (parent-child strategy)`);
        return savedCount;
    }
    async prepareKeywordsForFile(normalizedText, filename, rawText) {
        const [textKws, pathKws] = await Promise.all([
            this.extractTextKeywords(normalizedText),
            this.extractFilepathKeywords(filename),
        ]);
        const headerKws = this.extractHeaderKeywords(rawText);
        const urlKws = this.extractUrlKeywords(rawText);
        const merged = [...new Set([...textKws, ...pathKws, ...headerKws, ...urlKws])];
        const sanitized = this.sanitizeKeywords(merged);
        const enriched = (0, transliteration_util_1.enrichKeywordsWithVariants)(sanitized);
        this.logger.log('Keyword pipeline result', {
            fromText: textKws.length,
            fromPath: pathKws.length,
            fromHeaders: headerKws.length,
            fromUrls: urlKws.length,
            afterSanitize: sanitized.length,
            afterEnrich: enriched.length,
        });
        return enriched;
    }
    async prepareKeywordsForChunk(chunkText, fileKeywords, sectionHeader) {
        const chunkSpecific = await this.extractTextKeywords(chunkText.slice(0, 2000));
        const headerParts = sectionHeader
            ? [
                sectionHeader,
                ...sectionHeader.split(/\s+/).filter(w => w.length > 2),
            ]
            : [];
        const merged = [
            ...new Set([
                ...chunkSpecific.slice(0, 12),
                ...headerParts,
                ...fileKeywords.slice(0, 6),
            ]),
        ];
        return (0, transliteration_util_1.enrichKeywordsWithVariants)(this.sanitizeKeywords(merged));
    }
    sanitizeKeywords(keywords) {
        return keywords.filter(kw => {
            if (!/[a-zA-Z\u0400-\u04FF]/u.test(kw))
                return false;
            if (kw.includes('\uFFFD'))
                return false;
            if (/%[0-9a-f]{2}/i.test(kw))
                return false;
            const chars = kw.replace(/\s/g, '');
            const total = chars.length;
            if (total === 0)
                return false;
            const mojibake = (kw.match(/[\u00C0-\u00FF]/g) ?? []).length;
            if (mojibake / total > 0.3)
                return false;
            const nonWord = (kw.match(/[^\w\u0400-\u04FF\s\-]/gu) ?? []).length;
            if (nonWord / total > 0.4)
                return false;
            return true;
        });
    }
    extractNameTokens(query) {
        const STOPS = new Set([
            'who', 'what', 'where', 'when', 'why', 'how', 'which', 'is', 'are', 'was',
            'were', 'does', 'do', 'did', 'has', 'have', 'had', 'the', 'a', 'an', 'and',
            'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
            'tell', 'me', 'about', 'describe', 'explain', 'give', 'list', 'show',
            'find', 'get', 'can', 'could', 'please', 'you', 'know', 'say',
            'this', 'that', 'these', 'those', 'he', 'she', 'they', 'his', 'her',
            'що', 'як', 'де', 'коли', 'хто', 'чому', 'який', 'яка', 'яке', 'які',
            'чи', 'або', 'та', 'це', 'є', 'у', 'в', 'на', 'до', 'по', 'про', 'за',
            'розкажи', 'підкажи', 'поясни', 'опиши', 'покажи', 'дай', 'знайди',
            'такий', 'така', 'таке', 'такі', 'про',
        ]);
        return query
            .replace(/[?!.,;:'"]/g, '')
            .split(/\s+/)
            .filter(t => t.length >= 2 && !STOPS.has(t.toLowerCase()))
            .map(t => (0, transliteration_util_1.generateNameVariants)(t));
    }
    extractHeaderKeywords(rawText) {
        const HEADER_RE = /^#{1,3}\s+(.+)$/gm;
        const keywords = new Set();
        let m;
        while ((m = HEADER_RE.exec(rawText)) !== null) {
            const line = m[1].replace(/[*_`~]/g, '');
            line
                .split(/[\s\-–—/|,;:()[\]{}]+/)
                .flatMap(w => w.split(/(?=[A-Z])/))
                .map(w => w.trim().toLowerCase())
                .filter(w => w.length > 1)
                .forEach(w => keywords.add(w));
        }
        return [...keywords].slice(0, 40);
    }
    extractUrlKeywords(text) {
        const keywords = new Set();
        let m;
        const URL_RE = /https?:\/\/([^\s"'<>]+)/g;
        while ((m = URL_RE.exec(text)) !== null) {
            this.splitDomainParts(m[1], keywords);
        }
        const DOMAIN_RE = /\b((?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.){1,5}[a-zA-Z]{2,10})\b/g;
        const fullUrlRanges = [];
        for (const urlMatch of text.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
            fullUrlRanges.push([urlMatch.index, urlMatch.index + urlMatch[0].length]);
        }
        while ((m = DOMAIN_RE.exec(text)) !== null) {
            const start = m.index;
            const inUrl = fullUrlRanges.some(([s, e]) => start >= s && start < e);
            if (!inUrl) {
                this.splitDomainParts(m[1], keywords);
            }
        }
        return [...keywords].slice(0, 50);
    }
    splitDomainParts(raw, out) {
        const TLD = new Set(['com', 'ua', 'net', 'org', 'io', 'co', 'www', 'http', 'https']);
        raw
            .split(/[./\-_?&#=+:→[\]()\\ |,\s]/)
            .map(s => s.toLowerCase().trim())
            .filter(s => s.length > 1 &&
            s.length < 30 &&
            !/^\d+$/.test(s) &&
            !/%[0-9a-f]{2}/i.test(s) &&
            !/^[a-z0-9]{20,}$/.test(s) &&
            !TLD.has(s))
            .forEach(s => out.add(s));
    }
    async extractTextKeywords(text) {
        const sample = text.slice(0, 2000);
        try {
            const prompt = `Extract 10-15 most important keywords from this document text.\n` +
                `Focus on: main topics, technologies, key processes, important terminology.\n` +
                `Return ONLY comma-separated lowercase keywords in both Ukrainian and English.\n` +
                `Do NOT translate or modify proper names (person names, company names).\n` +
                `Example: react, frontend, компоненти, components, state, стан\n\n` +
                `Text:\n${sample}\n\nKeywords:`;
            const response = await this.chatLlmPort.complete(prompt, {
                temperature: 0.2, maxTokens: 150,
            });
            const keywords = response
                .split(',')
                .map(k => k.trim().toLowerCase())
                .filter(k => k.length > 2 && k.length < 30);
            return [...new Set(keywords)].slice(0, 20);
        }
        catch (error) {
            this.logger.warn('Text keyword extraction failed, falling back to frequency', {
                error: error.message,
            });
            return this.frequencyKeywords(sample);
        }
    }
    async extractFilepathKeywords(filepath) {
        const keywords = new Set();
        for (const part of filepath.replace(/\.md$/i, '').split(/[/\\]/)) {
            part
                .split(/[\s_-]+/)
                .flatMap(w => w.split(/(?=[A-Z])/))
                .map(w => w.toLowerCase())
                .filter(w => w.length > 2)
                .forEach(w => keywords.add(w));
        }
        return [...keywords].slice(0, 10);
    }
    frequencyKeywords(sample) {
        const STOP = new Set(['який', 'якщо', 'також', 'this', 'that', 'which']);
        const words = sample
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 4 && !STOP.has(w));
        const freq = new Map();
        for (const w of words)
            freq.set(w, (freq.get(w) ?? 0) + 1);
        return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w]) => w);
    }
    buildFileId(originalname) {
        return originalname
            .replace(/\.md$/i, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .toLowerCase()
            .substring(0, 50);
    }
    async classifyQuery(query) {
        const { classificationCacheTtlSec } = this.ragSettings.get();
        const key = `classification:${query.trim().toLowerCase().slice(0, 120)}`;
        const ttl = classificationCacheTtlSec;
        const span = { spanName: 'classify' };
        const started = Date.now();
        this.tracing.startSpan(span);
        try {
            const cached = await this.cache.get(key);
            if (cached) {
                this.tracing.endSpan(span, Date.now() - started);
                return cached;
            }
        }
        catch (err) {
            this.logger.warn('classifyQuery: Redis get failed', { error: err?.message });
        }
        const result = await this.queryClassifier.classify(query);
        this.logger.log('classifyQuery_result', { type: result.type, confidence: result.confidence });
        try {
            await this.cache.set(key, result, ttl);
        }
        catch (err) {
            this.logger.warn('classifyQuery: Redis set failed', { error: err?.message });
        }
        this.tracing.endSpan(span, Date.now() - started);
        return result;
    }
    async retrieve(query, limit, options) {
        const retrieveSpan = { spanName: 'retrieve' };
        const retrieveStarted = Date.now();
        this.tracing.startSpan(retrieveSpan);
        const { textRagDefaultLimit: defaultLimit, textRagCollectionName: collectionFromSettings, hybridKeywordScrollLimit, } = this.ragSettings.get();
        const effectiveLimit = limit ?? options?.limit ?? defaultLimit;
        const { useHybridSearch, useReranking, rerankStrategy, useQueryTransformation, useContextualCompression, useConversationMemory, sessionId, scoreThreshold, filters, _searchMode, } = options || {};
        const collectionName = collectionFromSettings;
        if (!collectionName)
            return 'RAG text collection name is not configured';
        const searchMode = _searchMode ?? 'balanced';
        const isEntityMode = searchMode === 'entity';
        const shouldUseHybridSearch = useHybridSearch !== false;
        const metadataFilter = this.buildMetadataFilter(filters);
        let keywords = [];
        let queriesToEmbed = [query];
        let uaStartIndex = -1;
        let uaTranslations = [];
        if (useQueryTransformation) {
            try {
                const transformed = await this.queryTransformer.transformQuery(query, isEntityMode);
                keywords = transformed.keywords.filter(kw => kw.length > 2 && !KEYWORD_STOP_WORDS.has(kw.toLowerCase()));
                const isShortQuery = query.trim().split(/\s+/).length <= 3;
                queriesToEmbed = isShortQuery
                    ? [transformed.original, ...transformed.expanded.slice(0, 1)].filter(Boolean)
                    : [
                        transformed.original,
                        ...transformed.expanded.slice(0, 2),
                        ...transformed.rephrased.slice(0, 1),
                    ].filter(Boolean).slice(0, 4);
                uaTranslations = (0, query_transformer_util_1.translateQueryToUkrainian)(query);
                if (uaTranslations.length > 0) {
                    this.logger.log('EN→UA query translation', { query, uaTranslations });
                    const beforeLen = queriesToEmbed.length;
                    queriesToEmbed = [...new Set([...queriesToEmbed, ...uaTranslations])].slice(0, 6);
                    if (queriesToEmbed.length > beforeLen) {
                        uaStartIndex = beforeLen;
                    }
                }
            }
            catch {
                keywords = [];
            }
        }
        this.logger.log('retrieve_keywords', { count: keywords.length, sample: keywords.slice(0, 5) });
        if (keywords.length === 0) {
            keywords = this.extractFallbackKeywords(query);
        }
        if (useConversationMemory && sessionId) {
            const history = await this.conversationRepository.getHistory(sessionId, 2);
            if (history.length > 0) {
                queriesToEmbed.push(`${query}\n\nPrevious: ${history.map(t => t.query).join('; ')}`);
                queriesToEmbed = queriesToEmbed.slice(0, 6);
            }
        }
        const rawEmbeddings = await Promise.all(queriesToEmbed.map(q => this.embeddingPort.embed(q)));
        const embeddings = rawEmbeddings
            .map(emb => (0, embedding_util_1.extractEmbedding)(emb))
            .filter(vector => vector.length > 0);
        if (embeddings.length === 0) {
            this.logger.error('retrieve: empty embeddings from Ollama', {
                queriesCount: queriesToEmbed.length,
            });
            throw new Error('Embedding generation returned empty vectors');
        }
        const primaryEmbedding = new embedding_vo_1.Embedding(embeddings[0]);
        let results = [];
        const effectivenessLimit = (searchMode === 'entity' ? 6 : 4) * effectiveLimit;
        const hybridBaseOpts = {
            searchMode,
            minTextLength: MIN_CHUNK_TEXT_LENGTH,
            originalQuery: query,
            keywordScrollLimit: hybridKeywordScrollLimit,
            ...(metadataFilter ? { filter: metadataFilter } : {}),
            ...(scoreThreshold !== undefined ? { scoreThreshold } : {}),
        };
        if (shouldUseHybridSearch) {
            let allSearchResults = await Promise.all(embeddings.map(emb => this.hybridSearch.search(collectionName, new embedding_vo_1.Embedding(emb), keywords, effectivenessLimit, hybridBaseOpts)));
            const isCompletelyEmpty = allSearchResults.every(arr => !arr || arr.length === 0);
            if (isCompletelyEmpty) {
                allSearchResults = await Promise.all(embeddings.map(emb => this.hybridSearch.search(collectionName, new embedding_vo_1.Embedding(emb), keywords, effectivenessLimit, {
                    ...hybridBaseOpts,
                    searchMode: 'wide',
                    scoreThreshold: undefined,
                })));
            }
            const validResults = allSearchResults.filter(Boolean);
            if (validResults.length === 0) {
                this.tracing.endSpan(retrieveSpan, Date.now() - retrieveStarted);
                return 'There is no relevant information in knowledge';
            }
            const resultById = new Map();
            const perQueryForRrf = [];
            for (const searchResults of validResults) {
                if (searchResults.length === 0)
                    continue;
                perQueryForRrf.push(searchResults.map(r => {
                    if (!resultById.has(r.id))
                        resultById.set(r.id, r);
                    return { id: r.id, score: r.hybridScore };
                }));
            }
            const { rrfK } = this.ragSettings.get();
            const rrfScores = reciprocalRankFusion(perQueryForRrf, rrfK);
            if (uaStartIndex >= 0 && uaTranslations.length > 0 && collectionName) {
                try {
                    const uaEmbeddings = embeddings.slice(uaStartIndex);
                    const uaSearchResults = await Promise.all(uaEmbeddings.map(emb => this.vectorSearch.search(collectionName, {
                        vector: emb,
                        limit: effectivenessLimit,
                        searchMode: 'wide',
                        score_threshold: null,
                    })));
                    let uaAdded = 0;
                    for (const points of uaSearchResults) {
                        for (const p of points) {
                            const id = p.id.toString();
                            const text = p.payload?.text ?? '';
                            if (text.trim().length < MIN_CHUNK_TEXT_LENGTH)
                                continue;
                            if (!resultById.has(id)) {
                                resultById.set(id, {
                                    id,
                                    text,
                                    parentText: p.payload?.parentText,
                                    parentId: p.payload?.parentId,
                                    vectorScore: p.score ?? 0,
                                    keywordScore: 0,
                                    hybridScore: p.score ?? 0,
                                });
                                uaAdded++;
                            }
                            const existingRrf = rrfScores.get(id) ?? 0;
                            rrfScores.set(id, existingRrf + (p.score ?? 0) * 0.9 / (rrfK + 1));
                        }
                    }
                    this.logger.log('UA vector search merged', { uaAdded, total: rrfScores.size });
                }
                catch (err) {
                    this.logger.warn('UA vector search failed', { error: err?.message });
                }
            }
            results = [...rrfScores.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([id, rrfScore]) => ({
                id,
                text: resultById.get(id)?.text ?? '',
                score: rrfScore,
            }))
                .filter(r => r.text.length > 0);
        }
        else {
            const vectorResults = await this.textRepository.findByEmbedding(primaryEmbedding, effectiveLimit * 3, {
                ...(scoreThreshold !== undefined ? { scoreThreshold } : {}),
                searchMode: isEntityMode ? 'wide' : 'balanced',
                ...(metadataFilter ? { filter: metadataFilter } : {}),
            });
            results = vectorResults.map(doc => ({
                id: doc.id,
                text: doc.text,
                score: doc.score ?? 0,
            }));
            results = results.filter(r => {
                if (r.text.trim().length < MIN_CHUNK_TEXT_LENGTH)
                    return false;
                if (/^\[[^\]]{2,60}\][\s\\]*$/.test(r.text.trim()))
                    return false;
                return true;
            });
            const topScores = results.slice(0, 3).map(r => r.score ?? 0);
            const avgTopScore = topScores.length
                ? topScores.reduce((a, b) => a + b, 0) / topScores.length
                : 0;
            const keywordMissing = isEntityMode && keywords.length > 0 &&
                !results.slice(0, 3).some(r => keywords.some(kw => r.text.toLowerCase().includes(kw.toLowerCase())));
            if (avgTopScore < 0.72 || keywordMissing) {
                const hybridFallback = await this.hybridSearch.search(collectionName, primaryEmbedding, keywords, effectiveLimit * 3, hybridBaseOpts);
                if (!hybridFallback) {
                    this.tracing.endSpan(retrieveSpan, Date.now() - retrieveStarted);
                    return 'There is no relevant information in knowledge';
                }
                results = hybridFallback.map(r => ({ id: r.id, text: r.text, score: r.hybridScore }));
            }
        }
        if (results.length === 0) {
            this.tracing.endSpan(retrieveSpan, Date.now() - retrieveStarted);
            return 'There is no relevant information in knowledge';
        }
        const entityCandidateLimit = searchMode === 'entity'
            ? Math.max(effectiveLimit * 4, 24)
            : effectiveLimit;
        const { rerankScoreFloor, rerankScoreFloorWithoutRerank, } = this.ragSettings.get();
        const rerankMethod = (0, rerank_strategy_util_1.normalizeRerankStrategy)(rerankStrategy);
        if (useReranking &&
            rerankMethod !== 'none' &&
            results.length > effectiveLimit) {
            const reranked = await this.reranker.rerank(query, results, {
                topK: entityCandidateLimit,
                method: rerankMethod,
            });
            results = reranked.map(r => ({ id: r.item.id, text: r.item.text, score: r.finalScore }));
        }
        const scoreFloor = useReranking && rerankMethod !== 'none'
            ? rerankScoreFloor
            : rerankScoreFloorWithoutRerank;
        results = results.filter(r => r.score > scoreFloor);
        results = results.filter(r => r.level !== 0);
        if (searchMode === 'entity') {
            const nameTokenGroups = this.extractNameTokens(query);
            if (nameTokenGroups.length > 0) {
                const matchScore = (text, groups) => {
                    const lower = text.toLowerCase();
                    const translitText = (0, transliteration_util_1.cyrillicToLatin)(lower);
                    let score = 0;
                    for (const variants of groups) {
                        const matched = variants.some(v => {
                            const vLower = v.toLowerCase();
                            return lower.includes(vLower) || translitText.includes((0, transliteration_util_1.cyrillicToLatin)(vLower));
                        });
                        if (matched)
                            score += 1;
                    }
                    return score;
                };
                const chunkMatches = (text, groups) => {
                    const lower = text.toLowerCase();
                    const translitText = (0, transliteration_util_1.cyrillicToLatin)(lower);
                    if (searchMode === 'entity') {
                        return groups.every(variants => variants.some(v => {
                            const vLower = v.toLowerCase();
                            return lower.includes(vLower) || translitText.includes((0, transliteration_util_1.cyrillicToLatin)(vLower));
                        }));
                    }
                    return groups.some(variants => variants.some(v => {
                        const vLower = v.toLowerCase();
                        return lower.includes(vLower) || translitText.includes((0, transliteration_util_1.cyrillicToLatin)(vLower));
                    }));
                };
                let filtered = results.filter((r, i) => {
                    const match = chunkMatches(r.text, nameTokenGroups);
                    this.logger.log('FILTER CHECK =>', { index: i, text: r.text, match });
                    return match;
                });
                if (filtered.length === 0) {
                    const surnameGroup = nameTokenGroups[nameTokenGroups.length - 1];
                    filtered = results.filter(r => {
                        const lower = r.text.toLowerCase();
                        const translitText = (0, transliteration_util_1.cyrillicToLatin)(lower);
                        return surnameGroup.some(v => {
                            const vLower = v.toLowerCase();
                            return lower.includes(vLower) || translitText.includes((0, transliteration_util_1.cyrillicToLatin)(vLower));
                        });
                    });
                }
                if (filtered.length > 0) {
                    filtered = filtered.sort((a, b) => {
                        const byNameMatch = matchScore(b.text, nameTokenGroups) - matchScore(a.text, nameTokenGroups);
                        if (byNameMatch !== 0)
                            return byNameMatch;
                        return (b.score ?? 0) - (a.score ?? 0);
                    });
                    this.logger.log('EntityPostFilter', {
                        query,
                        groups: nameTokenGroups.map(g => g.slice(0, 4)),
                        before: results.length,
                        after: filtered.length,
                    });
                    results = filtered;
                }
                else {
                    const fallbackLimit = Math.min(3, effectiveLimit);
                    results = [...results]
                        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                        .slice(0, fallbackLimit);
                    results.forEach(r => {
                        r.entityFilterFallback = true;
                    });
                    this.logger.warn('EntityPostFilter: no name match, returning top-K vector results', {
                        query,
                        nameGroups: nameTokenGroups.map(g => g[0]),
                        topResult: results[0]?.text.slice(0, 80),
                        resultCount: results.length,
                        fallbackLimit,
                    });
                }
            }
        }
        results = results.slice(0, effectiveLimit);
        const shouldCompress = useContextualCompression && searchMode !== 'entity';
        if (shouldCompress) {
            try {
                const compressed = await this.contextualCompressor.compressContext(query, results.map(r => ({ id: r.id, text: r.text })));
                results = results.map((r, i) => ({
                    ...r,
                    text: compressed?.[i]?.compressed ?? r.text,
                }));
            }
            catch { }
        }
        this.tracing.endSpan(retrieveSpan, Date.now() - retrieveStarted);
        return results;
    }
    extractFallbackKeywords(query) {
        return [...new Set(query
                .toLowerCase()
                .replace(/[?!.,;:'"]/g, ' ')
                .split(/\s+/)
                .map(token => token.trim())
                .filter(token => token.length > 2 && !KEYWORD_STOP_WORDS.has(token)))].slice(0, 15);
    }
    buildMetadataFilter(filters) {
        if (!filters?.length)
            return undefined;
        const must = [];
        const mustNot = [];
        for (const filter of filters) {
            if (!filter?.field)
                continue;
            if (filter.value === undefined || filter.value === null)
                continue;
            const key = filter.field;
            const op = filter.operator ?? 'eq';
            if (op === 'ne') {
                mustNot.push({ key, match: { value: filter.value } });
                continue;
            }
            if (op === 'in' && Array.isArray(filter.value)) {
                const values = filter.value.filter(v => v !== undefined && v !== null);
                if (!values.length)
                    continue;
                must.push({
                    should: values.map(value => ({ key, match: { value } })),
                });
                continue;
            }
            if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte') {
                if (typeof filter.value !== 'number')
                    continue;
                must.push({
                    key,
                    range: {
                        ...(op === 'gt' ? { gt: filter.value } : {}),
                        ...(op === 'gte' ? { gte: filter.value } : {}),
                        ...(op === 'lt' ? { lt: filter.value } : {}),
                        ...(op === 'lte' ? { lte: filter.value } : {}),
                    },
                });
                continue;
            }
            must.push({ key, match: { value: filter.value } });
        }
        if (must.length === 0 && mustNot.length === 0)
            return undefined;
        return {
            ...(must.length > 0 ? { must } : {}),
            ...(mustNot.length > 0 ? { must_not: mustNot } : {}),
        };
    }
    deduplicateContextDocs(docs, limit) {
        const seen = new Set();
        const deduped = [];
        for (const doc of docs) {
            const normalized = doc.text
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 260);
            if (!normalized)
                continue;
            if (seen.has(normalized))
                continue;
            seen.add(normalized);
            deduped.push(doc);
            if (deduped.length >= limit)
                break;
        }
        return deduped;
    }
    async getAllDocuments() {
        const documents = await this.textRepository.findAll();
        return documents.map(doc => ({
            id: doc.id,
            text: doc.text,
            createdAt: doc.createdAt.toISOString(),
            model: doc.model,
        }));
    }
    async prepareGenerationContext(query, options) {
        const traceStartMs = Date.now();
        const classification = await this.classifyQuery(query);
        const p = classification.params;
        this.logger.log('QueryClassification', {
            query: query.slice(0, 60),
            type: classification.type,
            confidence: classification.confidence,
            params: {
                searchMode: p.searchMode, limit: p.limit, threshold: p.scoreThreshold,
                temperature: p.temperature, topP: p.topP, topK: p.topK,
                maxTokens: p.maxTokens, repeatPenalty: p.repeatPenalty, seed: p.seed,
            },
        });
        const retrieveOptions = {
            limit: options?.limit ?? p.limit,
            scoreThreshold: options?.scoreThreshold ?? p.scoreThreshold,
            useHybridSearch: options?.useHybridSearch ?? p.useHybridSearch,
            useReranking: options?.useReranking ?? p.useReranking,
            rerankStrategy: options?.rerankStrategy ?? p.rerankStrategy,
            useQueryTransformation: options?.useQueryTransformation ?? p.useQueryTransformation,
            useContextualCompression: options?.useContextualCompression ?? p.useContextualCompression,
            useConversationMemory: options?.useConversationMemory ?? p.useConversationMemory,
            filters: options?.filters,
            sessionId: options?.sessionId,
            _searchMode: p.searchMode,
        };
        const retrieveStartMs = Date.now();
        const [rawRetrieved, linksResult] = await Promise.all([
            this.retrieve(query, undefined, retrieveOptions),
            this.linkService
                .findLinksForQuery(query)
                .then(r => (r.found ? r : this.linkService.findLinksForContext(query)))
                .catch((err) => {
                this.logger.warn('prepareGenerationContext: linkService failed', { error: err?.message });
                return { found: false, block: '' };
            }),
        ]);
        if (typeof rawRetrieved === 'string') {
            return { earlyExit: rawRetrieved };
        }
        const retrieveDurationMs = Date.now() - retrieveStartMs;
        const effectiveThreshold = classification.type === 'factual'
            ? Math.min(p.scoreThreshold, this.ragSettings.get().factualScoreThresholdCap)
            : p.scoreThreshold;
        const applyFilter = classification.type === 'factual' && classification.confidence > 0.8;
        const scoreHistogram = (0, score_histogram_util_1.buildScoreHistogram)(rawRetrieved.map(el => el.score ?? 0));
        const preFiltered = applyFilter && effectiveThreshold
            ? rawRetrieved.filter(el => (el.score ?? 0) >= effectiveThreshold)
            : rawRetrieved;
        const postFilterResults = preFiltered.length > 0
            ? preFiltered
            : (() => {
                this.logger.warn('Score filter removed all results, falling back to unfiltered', {
                    rawCount: rawRetrieved.length,
                    threshold: effectiveThreshold,
                });
                return rawRetrieved.slice(0, 3);
            })();
        const entityFilterFallback = rawRetrieved.some((r) => r.entityFilterFallback);
        const retrieved = p.useParentExpansion
            ? await this.expandToParentContext(postFilterResults)
            : postFilterResults;
        if (retrieved.length === 0) {
            return { earlyExit: 'Відповідь відсутня у наданій інформації.' };
        }
        const useKG = options?.useKnowledgeGraph ?? p.useKnowledgeGraph;
        const kgContext = useKG ? await this.queryKnowledgeGraph(query) : undefined;
        const contextLimit = classification.type === 'entity' ? 8 : 7;
        const retrievedForPrompt = this.deduplicateContextDocs([...retrieved].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), contextLimit);
        const context = await this.ragContextFormatting.formatRetrievedDocuments(retrievedForPrompt.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
        let prompt = this.buildPrompt(classification.type, context, query);
        if (kgContext) {
            prompt +=
                `\n\n<knowledge_graph>\n${kgContext}\n</knowledge_graph>\n` +
                    `(Граф знань надає додатковий контекст про сутності, але пріоритет — документальний контекст вище.)`;
        }
        if (options?.conversationHistory?.length) {
            const historyBlock = '\n====================\nІСТОРІЯ РОЗМОВИ:\n' +
                options.conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') +
                '\n';
            prompt += `\n\n<conversation_history>\n${historyBlock}\n</conversation_history>`;
        }
        if (classification.type !== 'entity') {
            prompt += `
        \n\n<linksResult>\n${linksResult.block}\n</linksResult>

        <links_usage_rules>
          - Використовуй linksResult лише якщо хоча б одне посилання прямо відповідає на запит
          - Якщо посилання лише дотично пов'язані — НЕ використовуй їх
          - Не вставляй посилання, якщо відповідь і так повна без них
          - Максимум 1–3 посилання
        </links_usage_rules>`;
        }
        prompt += `\n\n<question>${query}</question>\n\nВідповідь (структурована, на основі контексту):`;
        this.logger.log('RagTrace_PrepareContext', {
            query: query.slice(0, 80),
            retrieveDurationMs,
            totalPrepareMs: Date.now() - traceStartMs,
            diagnostics: {
                effectiveLimit: retrieveOptions.limit ?? p.limit,
                preFilterCount: rawRetrieved.length,
                postFilterCount: postFilterResults.length,
                finalCount: retrieved.length,
                searchMode: p.searchMode,
            },
        });
        const generationParams = {
            temperature: options?.temperature ?? p.temperature,
            topP: options?.topP ?? p.topP,
            topK: options?.topK ?? p.topK,
            maxTokens: options?.maxTokens ?? p.maxTokens,
            repeatPenalty: p.repeatPenalty,
            seed: p.seed,
        };
        return {
            classification,
            p,
            retrieved,
            prompt,
            generationParams,
            retrievalDiagnostics: {
                effectiveLimit: retrieveOptions.limit ?? p.limit,
                preFilterCount: rawRetrieved.length,
                postFilterCount: postFilterResults.length,
                finalCount: retrieved.length,
                searchMode: p.searchMode,
                hybridEnabled: retrieveOptions.useHybridSearch ?? p.useHybridSearch,
                rerankEnabled: retrieveOptions.useReranking ?? p.useReranking,
                contextualCompressionEnabled: retrieveOptions.useContextualCompression ?? p.useContextualCompression,
                effectiveThreshold,
                scoreFilterApplied: applyFilter,
                scoreHistogram,
                entityFilterFallback,
            },
        };
    }
    extractVerificationChunks(response) {
        const fromSources = (response.sources ?? []).map(s => s.text).filter(Boolean);
        if (fromSources.length)
            return fromSources;
        return (response.citations ?? []).map(c => c.text).filter(Boolean);
    }
    async finalizeAnswerWithGrounding(response) {
        const answerText = response.formattedAnswer ?? response.answer ?? '';
        const chunks = this.extractVerificationChunks(response);
        if (!answerText.trim() || !chunks.length) {
            return response;
        }
        const verification = await this.confidencePort.verify(answerText, chunks);
        const grounding = (0, answer_grounding_policy_1.applyGroundingPolicy)(answerText, verification);
        return {
            ...response,
            answer: grounding.finalAnswer,
            formattedAnswer: grounding.finalAnswer,
            answerConfidence: grounding.answerConfidence,
            confidence: grounding.answerConfidence,
        };
    }
    async runConfidenceCheck(query, answer, retrieved) {
        const verification = await this.confidencePort.verify(answer, retrieved.map(r => r.text));
        this.logger.log('Stream_Confidence', {
            score: verification.confidence.score,
            tier: verification.confidence.tier,
            grounded: verification.grounded,
            verdict: verification.llmVerdict,
        });
        if (!verification.grounded &&
            verification.llmVerdict === 'NO' &&
            verification.confidence.score < 0.4) {
            this.logger.warn('Stream_Confidence: potential hallucination detected', {
                query: query.slice(0, 80),
                score: verification.confidence.score,
                verdict: verification.llmVerdict,
            });
        }
    }
    persistSessionTurn(sessionId, query, answer) {
        setImmediate(() => {
            this.embeddingPort
                .embed(query)
                .then(emb => this.conversationRepository.addTurn(sessionId, query, answer, (0, embedding_util_1.extractEmbedding)(emb)))
                .catch(err => this.logger.warn('Session embed failed', { error: err?.message }));
        });
    }
    buildPrompt(type, context, query) {
        const PROMPTS = {
            entity: `
      Ти — асистент корпоративної бази знань.

      ТВОЄ ГОЛОВНЕ ПРАВИЛО:
      Використовуй ТІЛЬКИ інформацію з <context>.
      ЗАБОРОНЕНО вигадувати будь-які факти поза контекстом.

      <context>
      ${context}
      </context>

      ЗАВДАННЯ:

      1. Проаналізуй ВЕСЬ контекст
      2. Візьми інформацію, яка прямо відповідає на поточне питання, і додай важливий контекст
      3. Відкинь тільки явно зайві біографічні/довідкові деталі, що не стосуються питання
      4. ОБ'ЄДНАЙ релевантне в цілісне, розгорнуте узагальнення

      ФОРМАТ ВІДПОВІДІ:

      - 1 короткий вступ (хто/що це)
      - далі 4-6 змістовних пунктів по суті питання
      - додавай важливі деталі та приклади з контексту, якщо вони допомагають зрозуміти відповідь

      ВАЖЛИВО:

      ❌ НЕ МОЖНА:
      - писати "ось фрагменти", "у документі сказано"
      - просто перераховувати шматки тексту
      - дублювати однакові факти

      ✅ ПОТРІБНО:
      - писати як готове пояснення для людини
      - об'єднувати інформацію з різних частин контексту

      Якщо інформації немає — відповідай:
      "Інформація відсутня в базі знань"

      Питання:
      ${query}

      Відповідь:
      `,
            factual: `
      Ти — асистент корпоративної бази знань.

      Відповідай ТІЛЬКИ на основі <context>.
      ЗАБОРОНЕНО вигадувати інформацію.

      <context>
      ${context}
      </context>

      ЗАВДАННЯ:

      1. Уважно прочитай ВЕСЬ контекст — навіть якщо відповідь згадана лише побіжно
      2. Визнач точну відповідь на питання
      3. Якщо інформація розкидана по кількох місцях — ОБ'ЄДНАЙ її в одну відповідь
      4. Якщо є часткова інформація — дай часткову відповідь, не мовчи

      ВАЖЛИВО:

      ❌ НЕ МОЖНА:
      - писати "у контексті сказано"
      - давати список фрагментів
      - копіювати шматки тексту без узагальнення
      - відмовлятись відповідати якщо є хоч якась релевантна інформація

      ✅ ПОТРІБНО:
      - сформулювати єдину чітку відповідь
      - якщо інформація часткова — відповісти на те, що є, і додати:
        "Для уточнення зверніться до відповідного відділу або менеджера."

      Тільки якщо контекст ВЗАГАЛІ не містить нічого по темі питання:
      "Ця інформація відсутня в базі знань. Зверніться до HR або свого менеджера."

      Питання:
      ${query}

      Відповідь:
      `,
            wide: `
      Ти — асистент корпоративної бази знань.

      Створи цілісну, структуровану та практично корисну відповідь на основі НАДАНОГО КОНТЕКСТУ.

      ## ГОЛОВНЕ ПРАВИЛО
      Використовуй ТІЛЬКИ інформацію з <context>.
      Не додавай жодних фактів, припущень, пояснень, прикладів або деталей, яких немає в контексті.
      Якщо певний аспект теми не покритий — просто не згадуй його.

      <context>
      ${context}
      </context>

      ## ПИТАННЯ
      ${query}

      ## ЩО ПОТРІБНО ЗРОБИТИ
      - Уважно проаналізуй ВЕСЬ контекст
      - Визнач головну тему та всі важливі підтеми
      - Об'єднай інформацію з різних фрагментів у логічні змістовні блоки
      - Прибери повтори, дублікати та фрагментарність
      - Якщо фрагменти доповнюють один одного — синтезуй їх у повний опис
      - Якщо є інструкція або процедура — оформи її як послідовність кроків
      - Якщо є правила, умови, винятки або обмеження — виділи їх окремо
      - Якщо контекст розкриває лише частину теми — максимально повно розкрий саме цю частину

      ## ЯК ПИСАТИ
      Пиши як готову сторінку внутрішньої бази знань або робочу інструкцію.

      Відповідь має бути: змістовною, цілісною, логічною, без повторів, без води,
      без сирого стилю з фрагментів, без мета-коментарів.

      ## НЕ МОЖНА
      Не пиши: "у контексті зазначено", "з наданої інформації видно", "ось що знайдено",
      "контекст містить", "у документах сказано".

      Не можна: перелічувати уривки, посилатися на документи, писати як search results dump,
      відмовлятись через неповний контекст, згадувати що контекст частковий.

      ## ПРІОРИТЕТИ
      1. Точність  2. Повнота в межах контексту  3. Логічна структура
      4. Практична корисність  5. Читабельність

      ## ФОРМАТ ВІДПОВІДІ

      ## Короткий вступ
      Стисло поясни суть теми.

      ## Основна частина
      Розбий матеріал на логічні підтеми та поясни їх як завершений матеріал.

      ## Процес / кроки
      Показуй лише якщо в контексті є процедура або інструкція.

      ## Важливі умови / правила / винятки
      Показуй лише якщо вони є в контексті.

      ## Практичні примітки
      Показуй лише якщо в контексті є важливі нюанси використання або операційні деталі.

      Відповідь:
      `,
        };
        return PROMPTS[type];
    }
    async generateAnswer(query, options) {
        try {
            prompt_injection_guard_1.PromptInjectionGuard.assertSafe(query);
        }
        catch (err) {
            return { answer: err?.message ?? 'Prompt injection detected' };
        }
        const cached = await this.ragCache.getCachedAnswer(query, options);
        if (cached) {
            const sanitizedCachedAnswer = this.sanitizeModelOutput(cached.formattedAnswer ?? cached.answer ?? '');
            this.logger.log('RagTrace_AnswerCache', {
                query: query.slice(0, 80),
                hit: true,
            });
            const cachedWithFlag = {
                ...cached,
                answer: sanitizedCachedAnswer,
                formattedAnswer: sanitizedCachedAnswer,
                retrievalDiagnostics: {
                    ...(cached.retrievalDiagnostics ?? {}),
                    cacheHit: true,
                },
            };
            const groundedCached = await this.finalizeAnswerWithGrounding(cachedWithFlag);
            if (options?.includeRetrievalDiagnostics)
                return groundedCached;
            const { retrievalDiagnostics, ...withoutDiagnostics } = groundedCached;
            return withoutDiagnostics;
        }
        const ctx = await this.prepareGenerationContext(query, options);
        if ('earlyExit' in ctx) {
            return { answer: ctx.earlyExit };
        }
        const { classification, p, retrieved, prompt, generationParams, retrievalDiagnostics } = ctx;
        const { temperature, topP, topK, maxTokens, repeatPenalty, seed } = generationParams;
        const generationStartMs = Date.now();
        const rawAnswer = await this.chatLlmPort.complete(prompt, {
            temperature,
            topP,
            topK,
            maxTokens,
            repeatPenalty,
            seed,
        });
        const answer = this.sanitizeModelOutput(rawAnswer);
        const generationDurationMs = Date.now() - generationStartMs;
        const useCitations = options?.useCitationTracking ?? p.useCitationTracking;
        let citations = [];
        let formattedAnswer = answer;
        if (useCitations) {
            const tracked = this.trackCitations(answer, retrieved);
            citations = tracked.citations;
            formattedAnswer = tracked.formattedAnswer;
        }
        const includeCitationProvenance = options?.includeCitationProvenance ?? true;
        if (!includeCitationProvenance) {
            citations = citations.map((cite) => ({ id: cite.id, documentId: cite.documentId, text: cite.text }));
        }
        if (options?.sessionId) {
            const embedding = await this.embeddingPort.embed(query);
            await this.conversationRepository.addTurn(options.sessionId, query, answer, (0, embedding_util_1.extractEmbedding)(embedding));
        }
        const topScore = retrieved[0]?.score;
        const retrievalScore = typeof topScore === 'number' ? topScore : undefined;
        const sourceSnapshots = retrieved.map(doc => ({
            id: doc.id,
            text: doc.text,
            score: doc.score,
            metadata: doc.metadata,
        }));
        let response = {
            answer: formattedAnswer,
            formattedAnswer,
            citations,
            relevantChunks: retrieved.length,
            retrievalConfidence: retrievalScore,
            confidence: retrievalScore,
            queryType: classification.type,
            queryConfidence: classification.confidence,
            generationParams,
            conversationContext: !!options?.sessionId,
            sources: sourceSnapshots,
            ...(options?.includeRetrievalDiagnostics && {
                retrievalDiagnostics: {
                    ...retrievalDiagnostics,
                    cacheHit: false,
                },
            }),
            ...(options?.includeSources && { sources: sourceSnapshots }),
        };
        response = await this.finalizeAnswerWithGrounding(response);
        await this.ragCache.setCachedAnswer(query, options, response);
        this.logger.log('RagTrace_GenerateAnswer', {
            query: query.slice(0, 80),
            generationDurationMs,
            answerChars: answer.length,
            citations: citations.length,
            relevantChunks: retrieved.length,
        });
        if (!options?.includeRetrievalDiagnostics && response.retrievalDiagnostics) {
            const { retrievalDiagnostics, ...withoutDiagnostics } = response;
            return withoutDiagnostics;
        }
        if (!options?.includeSources && response.sources) {
            const { sources, ...withoutSources } = response;
            return withoutSources;
        }
        return response;
    }
    async *streamableGenerateAnswer(query, options) {
        try {
            prompt_injection_guard_1.PromptInjectionGuard.assertSafe(query);
        }
        catch (err) {
            yield { event: 'error', error: 'Prompt injection detected' };
            return;
        }
        const cached = await this.ragCache.getCachedAnswer(query, options);
        if (cached) {
            const sanitizedCachedAnswer = this.sanitizeModelOutput(cached.formattedAnswer ?? cached.answer ?? '');
            this.logger.log('RagTrace_Stream_AnswerCache', { query: query.slice(0, 80), hit: true });
            const cachedWithFlag = {
                ...cached,
                answer: sanitizedCachedAnswer,
                formattedAnswer: sanitizedCachedAnswer,
                retrievalDiagnostics: { ...(cached.retrievalDiagnostics ?? {}), cacheHit: true },
            };
            const groundedCached = await this.finalizeAnswerWithGrounding(cachedWithFlag);
            const streamAnswer = groundedCached.formattedAnswer ?? groundedCached.answer;
            yield {
                event: 'metadata',
                metadata: {
                    relevantChunks: groundedCached.relevantChunks,
                    confidence: groundedCached.answerConfidence ?? groundedCached.confidence,
                    answerConfidence: groundedCached.answerConfidence,
                    queryType: groundedCached.queryType,
                    queryConfidence: groundedCached.queryConfidence,
                    generationParams: groundedCached.generationParams,
                    conversationContext: groundedCached.conversationContext,
                    ...(options?.includeRetrievalDiagnostics && {
                        retrievalDiagnostics: groundedCached.retrievalDiagnostics,
                    }),
                },
            };
            yield { event: 'token', token: streamAnswer };
            yield {
                event: 'done',
                metadata: {
                    citations: groundedCached.citations ?? [],
                    relevantChunks: groundedCached.relevantChunks ?? 0,
                    answerConfidence: groundedCached.answerConfidence,
                },
            };
            return;
        }
        let ctx = { earlyExit: 'Prepare generation context failed' };
        try {
            ctx = await this.prepareGenerationContext(query, options);
        }
        catch (err) {
            this.logger.error('streamableGenerateAnswer: prepareGenerationContext failed', {
                error: err?.message,
            });
            yield { event: 'error', error: 'Prepare generation context failed' };
            return;
        }
        if ('earlyExit' in ctx) {
            yield { event: 'metadata', metadata: { relevantChunks: 0, citations: [] } };
            yield { event: 'token', token: ctx.earlyExit };
            yield { event: 'done', metadata: { relevantChunks: 0, citations: [] } };
            return;
        }
        const { classification, p, retrieved, prompt, generationParams, retrievalDiagnostics } = ctx;
        const { temperature, topP, topK, maxTokens, repeatPenalty, seed } = generationParams;
        const relevantChunks = retrieved.length;
        const retrievalConfidence = retrieved[0]?.score;
        yield {
            event: 'metadata',
            metadata: {
                relevantChunks,
                retrievalConfidence,
                confidence: retrievalConfidence,
                queryType: classification.type,
                queryConfidence: classification.confidence,
                generationParams,
                conversationContext: !!options?.sessionId,
                ...(options?.includeRetrievalDiagnostics && {
                    retrievalDiagnostics: { ...retrievalDiagnostics, cacheHit: false },
                }),
                ...(options?.includeSources && {
                    sources: retrieved.map(doc => ({
                        id: doc.id,
                        text: doc.text,
                        score: doc.score,
                        metadata: doc.metadata,
                    })),
                }),
            },
        };
        let rawFullAnswer = '';
        let streamedSanitizedAnswer = '';
        try {
            for await (const token of this.chatLlmPort.stream(prompt, {
                temperature,
                topP,
                topK,
                maxTokens,
                repeatPenalty,
                seed,
            })) {
                rawFullAnswer += token;
                const sanitizedNow = this.sanitizeModelOutput(rawFullAnswer);
                const delta = sanitizedNow.slice(streamedSanitizedAnswer.length);
                if (delta) {
                    streamedSanitizedAnswer = sanitizedNow;
                    yield { event: 'token', token: delta };
                }
            }
        }
        catch (err) {
            yield { event: 'error', error: 'LLM streaming failed' };
            return;
        }
        const finalAnswer = streamedSanitizedAnswer;
        let citations = [];
        try {
            const useCitations = options?.useCitationTracking ?? p.useCitationTracking;
            citations = useCitations
                ? this.trackCitations(finalAnswer, retrieved).citations
                : [];
            const includeCitationProvenance = options?.includeCitationProvenance ?? true;
            if (!includeCitationProvenance) {
                citations = citations.map((cite) => ({ id: cite.id, documentId: cite.documentId, text: cite.text }));
            }
        }
        catch (err) {
            yield { event: 'error', error: 'Citation tracking failed' };
            return;
        }
        if (citations.length) {
            yield { event: 'citations', citations };
        }
        const preGroundResponse = {
            answer: finalAnswer,
            formattedAnswer: finalAnswer,
            citations,
            relevantChunks,
            retrievalConfidence,
            confidence: retrievalConfidence,
            queryType: classification.type,
            queryConfidence: classification.confidence,
            generationParams,
            conversationContext: !!options?.sessionId,
            sources: retrieved.map(doc => ({
                id: doc.id,
                text: doc.text,
                score: doc.score,
                metadata: doc.metadata,
            })),
        };
        if (options?.sessionId) {
            this.persistSessionTurn(options.sessionId, query, finalAnswer);
        }
        void this.finalizeStreamAnswerInBackground(query, options, preGroundResponse);
        yield {
            event: 'done',
            metadata: {
                citations,
                relevantChunks,
                answerConfidence: retrievalConfidence,
            },
        };
    }
    finalizeStreamAnswerInBackground(query, options, response) {
        void (async () => {
            let answerConfidence;
            let cachedResponse = response;
            try {
                const grounded = await this.finalizeAnswerWithGrounding(response);
                answerConfidence = grounded.answerConfidence;
                cachedResponse = {
                    ...grounded,
                    citations: response.citations,
                    relevantChunks: response.relevantChunks,
                    retrievalConfidence: response.retrievalConfidence,
                    confidence: grounded.answerConfidence ?? response.retrievalConfidence,
                };
            }
            catch (err) {
                this.logger.warn('Stream_Confidence: check failed', { error: err?.message });
            }
            try {
                await this.ragCache.setCachedAnswer(query, options, cachedResponse);
            }
            catch (err) {
                this.logger.warn('Stream_Cache: set failed', { error: err?.message });
            }
        })();
    }
    async deleteById(id) {
        await this.textRepository.deleteById(id);
        await this.ragCache.invalidateAnswerCache();
        return { deletedDocumentId: id };
    }
    trackCitations(answer, retrievedDocs) {
        const citations = [];
        let formattedAnswer = answer;
        retrievedDocs.forEach((doc, idx) => {
            const metadata = doc.metadata ?? {};
            const sentences = doc.text.match(/[^.!?…]+[.!?…]+/g) || [];
            sentences.forEach(sentence => {
                if (sentence.length < 20)
                    return;
                if (this.findSimilarContent(answer, sentence)) {
                    citations.push({
                        id: `cite_${idx}`,
                        documentId: doc.id,
                        text: sentence,
                        provenance: {
                            chunkId: doc.chunkId ?? metadata.chunkId,
                            model: doc.model,
                            createdAt: doc.createdAt,
                            startIndex: doc.startIndex ?? metadata.startIndex,
                            endIndex: doc.endIndex ?? metadata.endIndex,
                        },
                    });
                }
            });
        });
        if (citations.length > 0) {
            const docIndices = new Map();
            let currentIndex = 1;
            citations.forEach(cite => {
                if (!docIndices.has(cite.documentId))
                    docIndices.set(cite.documentId, currentIndex++);
            });
            citations.forEach(cite => {
                const index = docIndices.get(cite.documentId);
                const anchor = cite.text.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                formattedAnswer = formattedAnswer.replace(new RegExp(anchor), match => `${match} [${index}]`);
            });
        }
        return { citations, formattedAnswer };
    }
    sanitizeModelOutput(answer) {
        return answer
            .replace(/<linksResult>[\s\S]*?<\/linksResult>/gi, '')
            .replace(/<linkResults>[\s\S]*?<\/linkResults>/gi, '')
            .replace(/<links_usage_rules>[\s\S]*?<\/links_usage_rules>/gi, '')
            .replace(/<\/?(linksResult|linkResults|links_usage_rules)>/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    findSimilarContent(haystack, needle) {
        const needleWords = needle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (needleWords.length === 0)
            return false;
        const haystackLower = haystack.toLowerCase();
        const matched = needleWords.filter(word => haystackLower.includes(word));
        return matched.length / needleWords.length > 0.6;
    }
    async expandToParentContext(results) {
        const parentIds = [...new Set(results.filter(r => r.parentId).map(r => r.parentId))];
        const parentTexts = new Map();
        if (parentIds.length > 0) {
            try {
                const { textRagCollectionName: collectionName } = this.ragSettings.get();
                if (collectionName) {
                    const parentPoints = await this.vectorSearch.getPoints(collectionName, parentIds);
                    for (const p of parentPoints) {
                        parentTexts.set(p.id.toString(), p.payload?.text ?? '');
                    }
                }
            }
            catch (err) {
                this.logger.warn('expandToParentContext: batch fetch failed', { err });
            }
        }
        const parentGroups = new Map();
        const noParent = [];
        for (const doc of results) {
            if (!doc.parentId) {
                noParent.push(doc);
                continue;
            }
            if (!parentGroups.has(doc.parentId)) {
                parentGroups.set(doc.parentId, { doc, children: [] });
            }
            parentGroups.get(doc.parentId).children.push(doc.text);
        }
        const merged = [];
        for (const [parentId, { doc, children }] of parentGroups) {
            const pText = parentTexts.get(parentId) ?? doc.parentText ?? '';
            const uniqueChildren = [...new Set(children)];
            const combinedText = pText
                ? `${pText}\n\n${uniqueChildren.join('\n\n')}`
                : uniqueChildren.join('\n\n');
            if (!pText) {
                this.logger.warn('expandToParentContext: parent text not found', {
                    parentId,
                    childCount: uniqueChildren.length,
                });
            }
            merged.push({
                ...doc,
                text: combinedText.slice(0, MAX_CONTEXT_CHARS),
            });
        }
        return [...merged, ...noParent];
    }
    async extractKnowledgeGraph(text, documentId) {
        try {
            const { entities, relationships } = await this.extractEntitiesAndRelations(text, documentId);
            this.logger.log('KG extraction complete', {
                entities: entities.length, relationships: relationships.length,
            });
            for (const entity of entities)
                await this.knowledgeGraph.addEntity(entity);
            for (const rel of relationships)
                await this.knowledgeGraph.addRelationship(rel);
        }
        catch (error) {
            this.logger.warn('Knowledge graph extraction failed', { error });
        }
    }
    async extractEntitiesAndRelations(text, sourceDocument) {
        const sample = text.slice(0, 4000);
        const prompt = `
      Extract named entities and their relationships from this document text.
      ENTITY TYPES: person, organization, location, technology, concept, product
      RELATIONSHIP TYPES: WORKS_ON, MEMBER_OF, LOCATED_IN, USES, MANAGES, PART_OF, CREATED_BY
      STRICT RULES:
      - ONLY include real named people, organizations, locations, technologies/products
      - EXCLUDE: usernames, durations, bare numbers, sentences over 60 chars
      - EXCLUDE anything with only dots/underscores (system usernames)
      Text: ${sample}
      Respond with ONLY valid JSON, no markdown:
      {"entities":[{"name":"...","type":"..."}],"relations":[{"from":"...","relation":"...","to":"..."}]}`;
        try {
            const response = await this.chatLlmPort.complete(prompt, { temperature: 0, maxTokens: 800 });
            const clean = response.replace(/```(?:json)?/g, '').trim();
            const jsonMatch = clean.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                return { entities: [], relationships: [] };
            const parsed = JSON.parse(jsonMatch[0]);
            const rawEntities = Array.isArray(parsed.entities) ? parsed.entities : [];
            const rawRelations = Array.isArray(parsed.relations) ? parsed.relations : [];
            const entities = rawEntities
                .filter(e => e?.name && e?.type && !this.isNoisyEntity(e.name, e.type))
                .map(e => ({
                id: this.buildCanonicalId(e.name, e.type),
                name: e.name,
                type: e.type.toLowerCase(),
                sourceDocument,
            }));
            const nameToId = new Map(entities.map(e => [e.name.toLowerCase(), e.id]));
            const relationships = rawRelations
                .filter(r => r?.from && r?.to && r?.relation)
                .map(r => {
                const fromId = nameToId.get(r.from.toLowerCase());
                const toId = nameToId.get(r.to.toLowerCase());
                if (!fromId || !toId || fromId === toId)
                    return null;
                return {
                    id: `${fromId}__${r.relation.toUpperCase()}__${toId}`,
                    fromEntityId: fromId,
                    toEntityId: toId,
                    type: r.relation.toUpperCase(),
                };
            })
                .filter((r) => r !== null);
            return { entities, relationships };
        }
        catch (error) {
            this.logger.warn('Entity extraction failed', { error });
            return { entities: [], relationships: [] };
        }
    }
    isNoisyEntity(name, type) {
        const t = name.trim();
        if (t.length < 2 || t.length > 60)
            return true;
        if (/[!?]/.test(t))
            return true;
        if (!/\s/.test(t) && /[._]/.test(t))
            return true;
        if (/^\d+(\s+\S{1,6})?$/.test(t))
            return true;
        if (type === 'concept' && /\d/.test(t))
            return true;
        return false;
    }
    buildCanonicalId(name, type) {
        const slug = (0, transliteration_util_1.cyrillicToLatin)(name)
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        return `${slug}_${type.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    async queryKnowledgeGraph(query) {
        try {
            const relevantEntities = await this.knowledgeGraph.queryEntities(query);
            this.logger.log('KG entities', { count: relevantEntities.length });
            if (!relevantEntities.length)
                return '';
            return relevantEntities.map(e => {
                const relTypes = e.properties?.relTypes;
                return relTypes?.length
                    ? `${e.name} is a ${e.type} (connected via: ${relTypes.join(', ')})`
                    : `${e.name} is a ${e.type}`;
            }).join('. ') + '.';
        }
        catch (error) {
            this.logger.warn('Knowledge graph query failed', { error });
            return '';
        }
    }
};
exports.TextRagService = TextRagService;
exports.TextRagService = TextRagService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ITextVectorSearchPort')),
    __param(1, (0, common_1.Inject)('IRagSettingsPort')),
    __param(2, (0, common_1.Inject)('ITextDocumentRepository')),
    __param(3, (0, common_1.Inject)('IConversationSessionRepository')),
    __param(4, (0, common_1.Inject)('IKnowledgeGraphPort')),
    __param(5, (0, common_1.Inject)('LoggerPort')),
    __param(6, (0, common_1.Inject)('IConfidencePort')),
    __param(7, (0, common_1.Inject)('IEmbeddingPort')),
    __param(8, (0, common_1.Inject)('IChatLlmPort')),
    __param(10, (0, common_1.Inject)('IRagContextFormattingPort')),
    __param(11, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(12, (0, common_1.Inject)('CachePort')),
    __param(15, (0, common_1.Inject)('IRagTracingPort')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object, Object, Object, link_service_1.LinkService, Object, redis_1.Redis, Object, rag_cache_service_1.RagCacheService,
        rag_ingest_service_1.RagIngestService, Object])
], TextRagService);
//# sourceMappingURL=text-rag.service.js.map