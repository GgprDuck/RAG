export type ChunkOptions = {
  minWords?: number;
  maxWords?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
};

export interface Chunk {
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, any>;
}

export function advancedChunkText(
  text: string,
  {
    minWords = 50,
    maxWords = 200,
    overlap = 20,
    preserveParagraphs = true,
  }: ChunkOptions = {},
): Chunk[] {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentWords = 0;
  let charIndex = 0;

  for (const paragraph of paragraphs) {
    const sentences = splitIntoSentences(paragraph);

    for (const sentence of sentences) {
      const wordCount = countWords(sentence);

      if (currentWords + wordCount > maxWords && currentWords >= minWords) {
        const chunkText = currentChunk.join(' ');
        const startIdx = charIndex - chunkText.length;
        chunks.push({
          text: chunkText,
          startIndex: startIdx,
          endIndex: charIndex,
        });

        if (overlap > 0 && currentChunk.length > 0) {
          const words = chunkText.split(/\s+/);
          const overlapWords = words.slice(-Math.min(overlap, words.length));
          currentChunk = [overlapWords.join(' ')];
          currentWords = overlapWords.length;
        } else {
          currentChunk = [];
          currentWords = 0;
        }
      }

      currentChunk.push(sentence);
      currentWords += wordCount;
      charIndex += sentence.length + 1;
    }

    if (preserveParagraphs && currentChunk.length > 0) {
      currentChunk.push('');
    }
  }

  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ').trim();
    if (chunkText) {
      chunks.push({
        text: chunkText,
        startIndex: charIndex - chunkText.length,
        endIndex: charIndex,
      });
    }
  }

  return chunks;
}

export function chunkTextBySentences(
  text: string,
  { minWords = 50, maxWords = 150 }: ChunkOptions = {},
): string[] {
  const chunks = advancedChunkText(text, {
    minWords,
    maxWords,
    overlap: 0,
    preserveParagraphs: false,
  });

  return chunks.map((chunk) => chunk.text);
}

function splitIntoSentences(text: string): string[] {
  const abbreviations = [
    'Mr',
    'Mrs',
    'Ms',
    'Dr',
    'Prof',
    'Sr',
    'Jr',
    'vs',
    'etc',
    'e.g',
    'i.e',
    'Ph.D',
    'M.D',
    'B.A',
    'M.A',
  ];

  let processed = text;
  const placeholders: Map<string, string> = new Map();

  abbreviations.forEach((abbr, idx) => {
    const placeholder = `__ABBR${idx}__`;
    const regex = new RegExp(`\\b${abbr}\\.`, 'gi');
    processed = processed.replace(regex, (match) => {
      placeholders.set(placeholder, match);
      return placeholder;
    });
  });

  const sentences = processed
    .split(/(?<=[.!?])\s+(?=[A-ZА-ЯІЇЄҐ])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((sentence) => {
    let restored = sentence;
    placeholders.forEach((original, placeholder) => {
      restored = restored.replace(placeholder, original);
    });
    return restored;
  });
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
