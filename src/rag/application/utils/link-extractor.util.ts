import { IKnowledgeLink, LinkType } from 'src/rag/domain/interfaces/knowledge-link.interface';

export interface ExtractedLink {
  url:      string;
  label:    string;
  context:  string;
  linkType: LinkType;
  keywords: string[];
}

const IMAGE_EXT  = /\.(png|jpe?g|gif|webp|svg|ico|bmp)(\?.*)?$/i;
const VIDEO_EXT  = /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i;
const VIDEO_HOST = /youtu\.?be|vimeo\.com|loom\.com|wistia\.com/i;

const KEYWORD_STOP = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will',
  'are', 'was', 'were', 'been', 'its', 'our', 'your', 'their', 'can',
  'not', 'but', 'has', 'had', 'all', 'also', 'more', 'use', 'used',
  'що', 'як', 'де', 'коли', 'хто', 'чому', 'який', 'яка', 'яке', 'які',
  'чи', 'або', 'та', 'це', 'є', 'у', 'в', 'на', 'до', 'по', 'про', 'за',
  'але', 'від', 'при', 'між', 'через', 'після', 'перед', 'над', 'під',
]);

const ABBR_VARIANTS: Record<string, string[]> = {
  'vpn':   ['впн'],
  'впн':   ['vpn'],
  'ip':    ['іп'],
  'іп':    ['ip'],
  'wifi':  ['вайфай', 'wi-fi'],
  'wi-fi': ['вайфай', 'wifi'],
  'вайфай':['wifi', 'wi-fi'],
  'dns':   ['днс'],
  'днс':   ['dns'],
  'ssl':   ['ссл'],
  'ссл':   ['ssl'],
  'https': ['хттпс'],
  'http':  ['хттп'],
  'hrm':   ['хрм'],
  'хрм':   ['hrm'],
  'crm':   ['срм'],
  'срм':   ['crm'],
  'erp':   ['єрп'],
  'єрп':   ['erp'],
  'kpi':   ['кпі'],
  'кпі':   ['kpi'],
  'api':   ['апі'],
  'апі':   ['api'],
  'ui':    ['юай'],
  'юай':   ['ui'],
};

export function isValidUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('.') && !/\s/.test(parsed.hostname);
  } catch {
    return false;
  }
}

function detectLinkType(url: string): LinkType {
  if (IMAGE_EXT.test(url))                         return 'image';
  if (VIDEO_EXT.test(url) || VIDEO_HOST.test(url)) return 'video';
  return 'url';
}

function extractContext(text: string, matchIndex: number, maxChars = 300): string {
  let start = matchIndex;
  while (start > 0) {
    const prev = text.lastIndexOf('\n', start - 1);
    if (prev === -1) { start = 0; break; }
    if (text.slice(prev + 1, start).trim() === '') { start = prev + 1; break; }
    start = prev;
  }

  
  let end = matchIndex;
  while (end < text.length) {
    const next = text.indexOf('\n', end + 1);
    if (next === -1) { end = text.length; break; }
    if (text.slice(end, next).trim() === '') { end = next; break; }
    end = next;
  }

  const paragraph = text.slice(start, end).replace(/\s+/g, ' ').trim();

  if (paragraph.length >= 20 && paragraph.length <= maxChars * 2) {
    return paragraph.slice(0, maxChars);
  }

  
  const wStart = Math.max(0, matchIndex - maxChars / 2);
  const wEnd   = Math.min(text.length, matchIndex + maxChars / 2);
  return text.slice(wStart, wEnd).replace(/\s+/g, ' ').trim();
}




function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/|,;:()[\]{}!?.'"<>]+/)
    .flatMap(w => w.split(/(?=[A-Z])/))
    .map(w => w.trim())
    .filter(w => w.length > 1 && !KEYWORD_STOP.has(w) && !/^\d+$/.test(w));
}

function buildKeywords(label: string, url: string, context: string): string[] {
  const kws = new Set<string>();

  const addWithVariants = (w: string) => {
    kws.add(w);
    for (const v of (ABBR_VARIANTS[w] ?? [])) kws.add(v);
  };

  
  tokenize(label).forEach(addWithVariants);

  
  try {
    const TLD    = new Set(['com', 'ua', 'net', 'org', 'io', 'co', 'app', 'dev', 'www']);
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);

    parsed.hostname
      .split('.')
      .filter(p => p.length > 2 && !TLD.has(p))
      .forEach(p => addWithVariants(p.toLowerCase()));

    parsed.pathname
      .split(/[/\-_?&#=+]/)
      .filter(p => p.length > 2 && !/^\d+$/.test(p))
      .map(p => p.toLowerCase())
      .forEach(p => addWithVariants(p));
  } catch {
    
    url
      .split(/[/\-_?&#=+.]/)
      .filter(p => p.length > 2 && !/^\d+$/.test(p))
      .map(p => p.toLowerCase())
      .forEach(p => addWithVariants(p));
  }

  
  const contextTokens = tokenize(context).filter(w => !kws.has(w));
  const freq          = new Map<string, number>();
  for (const w of contextTokens) freq.set(w, (freq.get(w) ?? 0) + 1);
  [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([w]) => addWithVariants(w));

  return [...kws].slice(0, 50);
}



export function extractLinksFromMarkdown(
  content: string,
  sourceFile: string,
): Omit<IKnowledgeLink, 'id' | 'createdAt' | 'updatedAt'>[] {
  
  
  const results = new Map<string, Omit<IKnowledgeLink, 'id' | 'createdAt' | 'updatedAt'>>();

  const add = (rawUrl: string, rawLabel: string, matchIndex: number) => {
    const url = rawUrl.trim();
    if (!url || url.startsWith('#') || url.startsWith('mailto:')) return;

    
    
    const label    = (rawLabel.trim() && rawLabel.trim() !== url) ? rawLabel.trim() : '';
    const existing = results.get(url);

    const currentLabelLen = existing
      ? (existing.label === existing.url ? 0 : existing.label.length)
      : -1;

    if (!existing || label.length > currentLabelLen) {
      const context = extractContext(content, matchIndex);
      results.set(url, {
        url,
        label:    label || url,
        context,
        sourceFile,
        linkType: detectLinkType(url),
        keywords: buildKeywords(label || url, url, context),
      });
    }
  };

  const imgRe  = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const linkRe = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  const autoRe = /<(https?:\/\/[^>]+)>/g;
  const bareRe = /(?<![(["'])https?:\/\/[^\s"'<>)[\]]+/g;

  let m: RegExpExecArray | null;

  while ((m = imgRe.exec(content))  !== null) add(m[2], m[1] || 'image', m.index);
  while ((m = linkRe.exec(content)) !== null) add(m[2], m[1], m.index);
  while ((m = autoRe.exec(content)) !== null) add(m[1], m[1], m.index);
  while ((m = bareRe.exec(content)) !== null) add(m[0], m[0], m.index);

  return [...results.values()];
}



export function isLinkQuery(query: string): boolean {
  const q = query.toLowerCase();
  return (
    /посилання|лінк[аи]?|сайт|url\b|link\b|адрес[аи]|куди|де знайти|де відкрити/i.test(q) ||
    /where.*link|give.*link|what.*url|send.*link|find.*link|open.*link/i.test(q) ||
    /\b(hrm|goals|figma|confluence|jira|slack|notion|drive|gitlab|github)\b/i.test(q)
  );
}