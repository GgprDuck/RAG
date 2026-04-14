import { Inject, Injectable } from '@nestjs/common';
import IORedis from 'ioredis';
import { CachePort } from 'src/rag/domain/ports/cache.port';

@Injectable()
export class IORedisCacheAdapter implements CachePort {
  constructor(@Inject('REDIS_CLIENT') private readonly client: IORedis) {}

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    if (!val) return null;

    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const str = JSON.stringify(value);

    if (ttl) {
      await this.client.setex(key, ttl, str);
    } else {
      await this.client.set(key, str);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    let cursor = '0';
  
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
  
      cursor = nextCursor;
  
      if (keys.length) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }
}