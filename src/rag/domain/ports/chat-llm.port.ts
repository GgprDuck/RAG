export interface LlmOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  repeatPenalty?: number;
  seed?: number;
  stop?: string[];
}

export interface IChatLlmPort {
  complete(prompt: string, options?: LlmOptions): Promise<string>;
  stream(prompt: string, options?: LlmOptions): AsyncGenerator<string>;
  describeImage(imageBuffer: Buffer, mimeType: string): Promise<string>;
  extractKeywords(text: string): Promise<string[]>;
}
