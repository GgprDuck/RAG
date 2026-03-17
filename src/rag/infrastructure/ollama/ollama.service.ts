import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import {
  RAG_CONFIG,
  TRagConfig,
} from 'src/rag/infrastructure/config/rag-config';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    err.code === 'ECONNABORTED' ||
    ((err.response?.status ?? 0) >= 500),
});

export interface LLMOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  stop?: string[];
  systemPrompt?: string;
  repeatPenalty?: number;
  seed?: number;
}

@Injectable()
export class OllamaService {
  private readonly baseURL: string;
  private readonly textEmbedModel: string;
  private readonly chatModel: string;
  private readonly visionModel: string;
  private readonly timeout = 60_000;
  private readonly visionTimeout = 120_000;

  constructor(
    private readonly configService: ConfigService,
    @Inject('LoggerPort') private readonly logger: LoggerPort,
  ) {
    const ragConfig = this.configService.get<TRagConfig>(RAG_CONFIG);
    this.baseURL = ragConfig?.ollamaBaseUrl || 'http://127.0.0.1:11434';
    this.textEmbedModel = ragConfig?.ollamaEmbedModelText || 'nomic-embed-text';
    this.chatModel = ragConfig?.ollamaChatModel || 'gemma3:4b';
    this.visionModel = ragConfig?.ollamaVisionModel || 'llama3.2-vision';
  }

  async embed(prompt: string): Promise<number[] | null> {
    try {
      const MAX_CHARS = 3000;
      const safePrompt = prompt.length > MAX_CHARS ? prompt.slice(0, MAX_CHARS) : prompt;
      const response = await axios.post(
        `${this.baseURL}/api/embeddings`,
        { model: this.textEmbedModel, prompt: safePrompt },
        { timeout: this.timeout },
      );
      const embedding = response.data?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        this.logger.warn('Empty embedding, skipping chunk');
        return null;
      }
      return embedding;
    } catch (error) {
      this.logger.warn('Embedding skipped', {
        error: this.getErrorMessage(error),
      });
      return null;
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: this.chatModel,
          messages: [
            {
              role: 'system',
              content: [
                'You extract search keywords from text.',
                'Rules:',
                '- Return ONLY a JSON array of lowercase nouns like ["cat", "dog"]',
                '- 3–10 keywords max',
                '- No stopwords, no duplicates, use singular form',
                '- No explanations, no markdown, just the JSON array',
              ].join('\n'),
            },
            { role: 'user', content: text },
          ],
          temperature: 0,
          stream: false,
        },
        { timeout: this.timeout },
      );
      const content = response.data?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Invalid LLM response for keywords extraction');
      }
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Failed to extract keywords:', error);
      throw error;
    }
  }

  async getRagResponseByPrompt(
    prompt: string,
    options: LLMOptions = {},
  ): Promise<string> {
    try {
      const messages: Array<{ role: string; content: string }> = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const requestBody: any = {
        model: this.chatModel,
        messages,
        stream: false,
        options: {
          temperature:    options.temperature ?? 0,
          top_p:          options.topP,
          top_k:          options.topK,
          num_predict:    options.maxTokens,
          repeat_penalty: options.repeatPenalty,
          seed:           options.seed,
        },
      };

      // Strip undefined keys so Ollama uses its own defaults
      Object.keys(requestBody.options).forEach((key) => {
        if (requestBody.options[key] === undefined) {
          delete requestBody.options[key];
        }
      });

      this.logger.log('LLM Request', {
        model:        this.chatModel,
        promptLength: prompt.length,
        options:      requestBody.options,
      });

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        requestBody,
        { timeout: this.timeout },
      );

      if (!response.data?.message?.content) {
        throw new Error('Invalid LLM response from Ollama');
      }
      return response.data.message.content;
    } catch (error) {
      this.logger.error('LLM request failed', {
        error:   this.getErrorMessage(error),
        prompt:  prompt.slice(0, 100),
        options,
      });
      throw new Error(`LLM request failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Streams the LLM response token-by-token using Ollama's NDJSON streaming
   * API (`stream: true`).  Each yielded value is one partial content token.
   */
  async *getRagResponseByPromptStream(
    prompt: string,
    options: LLMOptions = {},
  ): AsyncGenerator<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: Record<string, unknown> = {
      model: this.chatModel,
      messages,
      stream: true,
      options: {
        temperature:    options.temperature ?? 0,
        top_p:          options.topP,
        top_k:          options.topK,
        num_predict:    options.maxTokens,
        repeat_penalty: options.repeatPenalty,
        seed:           options.seed,
      },
    };

    // Remove undefined keys so Ollama uses its own defaults.
    const llmOpts = requestBody.options as Record<string, unknown>;
    Object.keys(llmOpts).forEach((k) => {
      if (llmOpts[k] === undefined) delete llmOpts[k];
    });

    this.logger.log('LLM Stream Request', {
      model:        this.chatModel,
      promptLength: prompt.length,
      options:      llmOpts,
    });

    const response = await axios.post(
      `${this.baseURL}/api/chat`,
      requestBody,
      { responseType: 'stream', timeout: this.timeout },
    );

    // Ollama sends newline-delimited JSON — accumulate incomplete lines.
    let tail = '';

    for await (const rawChunk of response.data as AsyncIterable<Buffer>) {
      tail += rawChunk.toString('utf-8');

      const lines = tail.split('\n');
      tail = lines.pop() ?? '';           // keep last (potentially incomplete) line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parsed: { message?: { content?: string }; done?: boolean; error?: string };
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          // Re-buffer on broken JSON (should be rare with NDJSON).
          tail = trimmed + '\n' + tail;
          continue;
        }

        if (parsed.error) {
          throw new Error(`Ollama stream error: ${parsed.error}`);
        }

        const token = parsed.message?.content;
        if (token) yield token;

        if (parsed.done) return;
      }
    }
  }

  async describeImage(file: Express.Multer.File): Promise<string> {
    try {
      const base64 = file.buffer.toString('base64');
      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: this.visionModel,
          messages: [
            {
              role: 'user',
              content: [
                'Describe this image in one short sentence.',
                'If it is an animal, include both type and breed (e.g., "Bulldog dog").',
                'If it is an event, describe it clearly (e.g., "Birthday party with balloons").',
                'Otherwise, describe the scene naturally and concisely.',
              ].join('\n'),
              images: [base64],
            },
          ],
          stream: false,
        },
        { timeout: this.visionTimeout },
      );
      const description = response.data?.message?.content;
      if (typeof description !== 'string') {
        throw new Error('Invalid LLM response for image description');
      }
      this.logger.log(`Image description: ${description}`);
      return description;
    } catch (error) {
      this.logger.error(`Image detection failed`, {
        error:    this.getErrorMessage(error),
        fileName: file.originalname,
      });
      throw new Error('Image detection failed');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (_error) {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      if (Array.isArray(response.data?.models)) {
        return response.data.models.map((m: { name: string }) => m.name);
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to list models', { error: this.getErrorMessage(error) });
      return [];
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      return error.response?.data?.error || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}