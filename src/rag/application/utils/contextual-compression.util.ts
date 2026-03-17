import { OllamaService } from '../../infrastructure/ollama/ollama.service';

export interface CompressedContext {
  original: string;
  compressed: string;
  relevantSentences: string[];
  compressionRatio: number;
}

export class ContextualCompressor {
  constructor(private readonly ollamaService: OllamaService) {}

  async compressContext(
    query: string,
    documents: Array<{ id: string; text: string }>,
    options: {
      maxTokens?: number;
      method?: 'extractive' | 'abstractive' | 'hybrid';
    } = {},
  ): Promise<CompressedContext[]> {
    const { maxTokens = 500, method = 'extractive' } = options;

    const compressed = await Promise.all(
      documents.map((doc) =>
        this.compressSingleDocument(query, doc.text, maxTokens, method),
      ),
    );

    return compressed;
  }

  private async compressSingleDocument(
    query: string,
    text: string,
    maxTokens: number,
    method: 'extractive' | 'abstractive' | 'hybrid',
  ): Promise<CompressedContext> {
    switch (method) {
      case 'extractive':
        return this.extractiveCompression(query, text, maxTokens);
      case 'abstractive':
        return this.abstractiveCompression(query, text, maxTokens);
      case 'hybrid':
        return this.hybridCompression(query, text, maxTokens);
    }
  }

  private async extractiveCompression(
    query: string,
    text: string,
    maxTokens: number,
  ): Promise<CompressedContext> {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length === 0) {
      return {
        original: text,
        compressed: '',
        relevantSentences: [],
        compressionRatio: 0,
      };
    }

    const [queryEmbedding, ...sentenceEmbeddings] = await Promise.all([
      this.ollamaService.embed(query),
      ...sentences.map((s) => this.ollamaService.embed(s.trim())),
    ]);

    const scoredSentences = sentences.map((sentence, idx) => ({
      sentence: sentence.trim(),
      score: this.cosineSimilarity(
        queryEmbedding!,
        sentenceEmbeddings[idx]!,
      ),
    }));

    const sortedSentences = scoredSentences
      .sort((a, b) => b.score - a.score);

    const relevantSentences: string[] = [];
    let tokenCount = 0;

    for (const { sentence } of sortedSentences) {
      const estimatedTokens = sentence.split(/\s+/).length;
      if (tokenCount + estimatedTokens <= maxTokens) {
        relevantSentences.push(sentence);
        tokenCount += estimatedTokens;
      } else {
        break;
      }
    }

    const compressed = relevantSentences.join(' ');

    return {
      original: text,
      compressed,
      relevantSentences,
      compressionRatio: compressed.length / text.length,
    };
  }

  private async abstractiveCompression(
    query: string,
    text: string,
    maxTokens: number,
  ): Promise<CompressedContext> {
    const maxWords = Math.floor(maxTokens * 0.75);

    const prompt = `
      Given this query: "${query}"

      Extract and summarize only the information from the following text that is relevant to answering the query.
      Keep it under ${maxWords} words and preserve key details.

      Text:
      ${text.slice(0, 2000)}

      Relevant summary:`;

    const compressed = await this.ollamaService.getRagResponseByPrompt(prompt);

    return {
      original: text,
      compressed: compressed.trim(),
      relevantSentences: compressed.match(/[^.!?]+[.!?]+/g) || [],
      compressionRatio: compressed.length / text.length,
    };
  }

  private async hybridCompression(
    query: string,
    text: string,
    maxTokens: number,
  ): Promise<CompressedContext> {
    const extractive = await this.extractiveCompression(
      query,
      text,
      Math.floor(maxTokens * 1.5),
    );

    if (extractive.compressed.length > maxTokens * 4) {
      const abstractive = await this.abstractiveCompression(
        query,
        extractive.compressed,
        maxTokens,
      );
      return abstractive;
    }

    return extractive;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}