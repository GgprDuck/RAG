import { Inject, Injectable } from '@nestjs/common';
import { Redis as RedisUpstash } from '@upstash/redis';
import { CachePort } from 'src/rag/domain/ports/cache.port';

@Injectable()
export class UpstashCacheAdapter implements CachePort {
  constructor(@Inject('REDIS_CLIENT') private readonly client: RedisUpstash) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.client.get<T>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.client.set(key, value, ttl ? { ex: ttl } : undefined);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    throw new Error(
      `Upstash does not support SCAN-based deletion. Pattern: ${pattern}`,
    );
  }
}