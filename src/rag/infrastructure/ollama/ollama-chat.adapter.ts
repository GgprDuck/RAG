import { Injectable } from '@nestjs/common';
import { IChatLlmPort, LlmOptions } from 'src/rag/domain/ports/chat-llm.port';
import { OllamaService } from './ollama.service';

@Injectable()
export class OllamaChatAdapter implements IChatLlmPort {
  constructor(private readonly ollama: OllamaService) {}

  async complete(prompt: string, options?: LlmOptions): Promise<string> {
    return this.ollama.getRagResponseByPrompt(prompt, {
      temperature: options?.temperature,
      topP: options?.topP,
      topK: options?.topK,
    });
  }

  async describeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
    return this.ollama.describeImage({
      buffer: imageBuffer,
      mimetype: mimeType,
    } as Express.Multer.File);
  }

  async extractKeywords(text: string): Promise<string[]> {
    return this.ollama.extractKeywords(text);
  }
}
