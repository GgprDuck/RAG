import { Logger } from '@nestjs/common';
import { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';

const logger = new Logger('Chunking');

export interface ChunkMetadata {
  chunkId: string;
  parentId?: string;
  childIds?: string[];
  level: number;
  startIndex: number;
  endIndex: number;
  headers?: string[];
  parentText?: string;
  sectionHeader?: string;
}

export interface SemanticChunk {
  text: string;
  metadata: ChunkMetadata;
}

export function splitIntoSentences(text: string): string[] {
  const ABBREV_RE =
    /\b(ст|рр|р|др|проф|доц|вул|пл|просп|обл|кв|год|грн|тис|млн|млрд|ім|пр|т|е|і|іст|буд|корп|оф|мал|табл|рис|п|п-т|с-щ)\./gi;
  const INITIALS_RE = /\b([А-ЯІЇЄҐA-Z])\./g;
  const DECIMAL_RE = /(\d)\.(\d)/g;
  const PH = '\x00';

  const protected_ = text
    .replace(ABBREV_RE, (_, abbr) => abbr + PH)
    .replace(INITIALS_RE, (_, l) => l + PH)
    .replace(DECIMAL_RE, (_, a, b) => `${a}${PH}${b}`);

  const raw = protected_.match(/[^.!?…]+[.!?…]+(?:\s|$)/g) || [text];
  return raw.map((s) => s.replace(/\x00/g, '.').trim()).filter(Boolean);
}

export async function semanticChunking(
  text: string,
  embedding: IEmbeddingPort,
  options: {
    minChunkSize?: number;
    maxChunkSize?: number;
    similarityThreshold?: number;
  } = {},
): Promise<SemanticChunk[]> {
  const { minChunkSize = 100, maxChunkSize = 500, similarityThreshold = 0.7 } = options;
  const sentences = splitIntoSentences(text);
  if (!sentences.length) return [];

  logger.debug(`Semantic chunking: ${sentences.length} sentences`);

  const offsets: { start: number; end: number }[] = [];
  let scan = 0;
  for (const s of sentences) {
    const idx = text.indexOf(s, scan);
    const start = idx === -1 ? scan : idx;
    offsets.push({ start, end: start + s.length });
    scan = start + s.length;
  }

  const BATCH = 100;
  const embeddings: (number[] | null)[] = [];
  for (let i = 0; i < sentences.length; i += BATCH) {
    const batch = sentences.slice(i, i + BATCH);
    const res = await Promise.all(batch.map((s) => embedding.embed(s.trim()).catch(() => null)));
    embeddings.push(...res);
    if (global.gc && i > 0 && i % (BATCH * 5) === 0) global.gc();
  }

  const chunks: SemanticChunk[] = [];
  let curText = '';
  let curEmb: number[] | null = null;
  let curStart = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const emb = embeddings[i];
    const { start, end } = offsets[i];

    if (!emb) {
      if (curText.length >= minChunkSize) {
        chunks.push({ text: curText.trim(), metadata: { chunkId: `sem_${chunks.length}`, level: 0, startIndex: curStart, endIndex: i > 0 ? offsets[i - 1].end : end } });
      }
      curText = ''; curEmb = null; curStart = end;
      continue;
    }

    if (!curEmb) { curText = s; curEmb = emb; curStart = start; continue; }

    const sim = cosineSimilarity(curEmb, emb);
    if ((sim < similarityThreshold || curText.length > maxChunkSize) && curText.length >= minChunkSize) {
      chunks.push({ text: curText.trim(), metadata: { chunkId: `sem_${chunks.length}`, level: 0, startIndex: curStart, endIndex: start } });
      curText = s; curEmb = emb; curStart = start;
    } else {
      curText += ' ' + s;
      curEmb = averageEmbeddings(curEmb, emb, curText.length, s.length);
    }
  }

  if (curText.trim()) {
    chunks.push({ text: curText.trim(), metadata: { chunkId: `sem_${chunks.length}`, level: 0, startIndex: curStart, endIndex: text.length } });
  }

  logger.debug(`Semantic chunking: ${chunks.length} chunks`);
  return chunks;
}

function findBoundary(text: string, target: number, windowSize = 200): number {
  if (target >= text.length) return text.length;
  const searchStart = Math.max(0, target - windowSize);
  const slice = text.slice(searchStart, target);
  const sm = slice.search(/[.!?…\n][^\S\n]*$/);
  if (sm !== -1) {
    const pos = searchStart + sm + 1;
    if (pos > target * 0.85) return pos;
  }
  const wm = slice.search(/\s[^\s]*$/);
  if (wm !== -1) return searchStart + wm + 1;
  return target;
}

interface MdSection {
  header: string | null;
  text: string;
  offset: number;
}

function splitMarkdownSections(text: string): MdSection[] {
  const headerRe = /^#{1,2}\s+.+$/gm;
  const positions: { index: number; header: string }[] = [];
  let m: RegExpExecArray | null;

  while ((m = headerRe.exec(text)) !== null) {
    positions.push({ index: m.index, header: m[0].trim() });
  }

  if (!positions.length) return [{ header: null, text, offset: 0 }];

  const sections: MdSection[] = [];

  if (positions[0].index > 0) {
    const preamble = text.slice(0, positions[0].index).trim();
    if (preamble) sections.push({ header: null, text: preamble, offset: 0 });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : text.length;
    sections.push({ header: positions[i].header, text: text.slice(start, end).trim(), offset: start });
  }

  return sections;
}

export interface ParentChildOptions {
  parentSize?: number;
  childSize?: number;
  overlap?: number;
  fileId?: string;
  storeParentText?: boolean;
  useMarkdownHeaders?: boolean;
}

export async function parentChildChunking(
  text: string,
  onChunk: (chunk: SemanticChunk) => Promise<void>,
  options: ParentChildOptions = {},
): Promise<void> {
  const {
    parentSize = 4000,
    childSize = 1200,
    overlap = 150,
    fileId = 'doc',
    storeParentText = true,
    useMarkdownHeaders = true,
  } = options;

  if (overlap >= childSize) {
    throw new Error(`overlap (${overlap}) must be less than childSize (${childSize})`);
  }

  const parents: Array<{ text: string; offset: number; header: string | null }> = [];

  if (useMarkdownHeaders) {
    for (const section of splitMarkdownSections(text)) {
      if (section.text.length <= parentSize) {
        parents.push({ text: section.text, offset: section.offset, header: section.header });
      } else {
        let pos = 0;
        let sub = 0;
        while (pos < section.text.length) {
          const rawEnd = Math.min(pos + parentSize, section.text.length);
          const boundary = rawEnd === section.text.length ? rawEnd : findBoundary(section.text, rawEnd);
          const slice = section.text.slice(pos, boundary).trim();
          if (slice) {
            parents.push({
              text: slice,
              offset: section.offset + pos,
              header: sub === 0 ? section.header : null,
            });
            sub++;
          }
          pos = boundary;
        }
      }
    }
  } else {
    let pos = 0;
    while (pos < text.length) {
      const rawEnd = Math.min(pos + parentSize, text.length);
      const boundary = rawEnd === text.length ? rawEnd : findBoundary(text, rawEnd);
      const slice = text.slice(pos, boundary).trim();
      if (slice) parents.push({ text: slice, offset: pos, header: null });
      pos = boundary;
    }
  }

  logger.debug(`parentChildChunking: ${parents.length} parent blocks`);

  for (let pi = 0; pi < parents.length; pi++) {
    const { text: parentText, offset: globalOffset, header } = parents[pi];
    const parentId = `${fileId}_p${pi}`;
    const children: SemanticChunk[] = [];

    let start = 0;
    let ci = 0;

    while (start < parentText.length) {
      const rawEnd = Math.min(start + childSize, parentText.length);
      const end = rawEnd === parentText.length ? rawEnd : findBoundary(parentText, rawEnd);
      const chunkText = parentText.slice(start, end).trim();

      if (chunkText) {
        children.push({
          text: chunkText,
          metadata: {
            chunkId: `${parentId}_c${ci++}`,
            parentId,
            level: 1,
            startIndex: globalOffset + start,
            endIndex: globalOffset + end,
            sectionHeader: header ?? undefined,
            ...(storeParentText ? { parentText } : {}),
          },
        });
      }

      if (end >= parentText.length) break;

      const rawOverlapStart = end - overlap;
      const overlapStart = findBoundary(parentText, rawOverlapStart, overlap);

      if (overlapStart <= start) {
        logger.warn(`[parentChildChunking] Overlap stuck at start=${start}, end=${end}. Skipping.`);
        start = end;
      } else {
        start = overlapStart;
      }
    }

    await onChunk({
      text: parentText,
      metadata: {
        chunkId: parentId,
        level: 0,
        startIndex: globalOffset,
        endIndex: globalOffset + parentText.length,
        childIds: children.map((c) => c.metadata.chunkId),
        sectionHeader: header ?? undefined,
      },
    });

    for (const child of children) {
      await onChunk(child);
    }

    logger.debug(
      `${parentId}: ${children.length} children` +
        (header ? ` [${header.slice(0, 50)}]` : ''),
    );
  }

  logger.debug('parentChildChunking: done');
}

function averageEmbeddings(a: number[], b: number[], wa = 1, wb = 1): number[] {
  return a.map((v, i) => (v * wa + b[i] * wb) / (wa + wb));
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}