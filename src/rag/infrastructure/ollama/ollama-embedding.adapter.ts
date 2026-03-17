import { Injectable } from '@nestjs/common';
import { IEmbeddingPort } from 'src/rag/domain/ports/embedding.port';
import { OllamaService } from './ollama.service';

@Injectable()
export class OllamaEmbeddingAdapter implements IEmbeddingPort {
  constructor(private readonly ollama: OllamaService) {}

  async embed(text: string): Promise<number[] | null> {
    return this.ollama.embed(text);
  }
}
