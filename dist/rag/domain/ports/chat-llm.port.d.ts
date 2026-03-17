export interface LlmOptions {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    stop?: string[];
}
export interface IChatLlmPort {
    complete(prompt: string, options?: LlmOptions): Promise<string>;
    describeImage(imageBuffer: Buffer, mimeType: string): Promise<string>;
    extractKeywords(text: string): Promise<string[]>;
}
