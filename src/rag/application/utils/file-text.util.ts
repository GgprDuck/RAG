import { extractWordText } from './word-parser.util';
import pdf from '@cedrugs/pdf-parse';

export async function extractFileText(
  file: Express.Multer.File,
): Promise<string> {
  const name = file.originalname.toLowerCase();

  if (name.endsWith('.docx')) {
    const raw = await extractWordText(file.buffer);
    assertValidEncoding(raw, file.originalname);
    return normalizeText(raw);
  }

  if (name.endsWith('.pdf')) {
    const data = await pdf(file.buffer);
    assertValidEncoding(data.text, file.originalname);
    return normalizeText(data.text);
  }

  if (name.endsWith('.md')) {
    const raw = file.buffer.toString('utf-8');
    assertValidEncoding(raw, file.originalname);
    return normalizeMarkdown(raw);
  }

  throw new Error('Unsupported file format');
}

function assertValidEncoding(text: string, filename: string): void {
  const badChars = (text.match(/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  const ratio = badChars / Math.max(text.length, 1);

  if (ratio > 0.05) {
    throw new Error(
      `File "${filename}" appears to have encoding issues (${(ratio * 100).toFixed(1)}% invalid characters). ` +
      `Ensure the file is saved as UTF-8.`,
    );
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeMarkdown(md: string): string {
  const withPrefixedHeaders = md
    .replace(/^#{1,6}\s+(.+)$/gm, (_match, content: string) => {
      return `\n[${content.trim()}]`;
    });

  const stripped = withPrefixedHeaders
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__|\*|_)/g, '')
    .replace(/^\|([-:| ])+\|$/gm, '')
    .replace(/^\|(\s*\|)+\s*$/gm, '')
    .replace(/^\|(.+)\|$/gm, (_match: string, inner: string) =>
      inner.split('|').map((c: string) => c.trim()).filter(Boolean).join(' | '),
    );

  return normalizeText(stripped);
}