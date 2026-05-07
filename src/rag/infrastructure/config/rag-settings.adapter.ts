import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IRagSettingsPort,
  RagRuntimeSettings,
} from 'src/rag/domain/ports/rag-settings.port';
import { RAG_CONFIG, TRagConfig } from './rag-config';

@Injectable()
export class RagSettingsAdapter implements IRagSettingsPort {
  constructor(private readonly configService: ConfigService) {}

  get(): RagRuntimeSettings {
    const c = this.configService.get<TRagConfig>(RAG_CONFIG);
    if (!c) {
      throw new Error('RAG_CONFIG is not registered');
    }
    return {
      ollamaEmbedModelText: c.ollamaEmbedModelText,
      textRagCollectionName: c.textRagCollectionName,
      textRagDefaultLimit: c.textRagDefaultLimit,
      textRagVectorSize: c.textRagVectorSize,
      imageRagMinScoreThreshold: c.imageRagMinScoreThreshold,
    };
  }
}
