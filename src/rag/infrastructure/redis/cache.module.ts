import { Module } from '@nestjs/common';
import { IORedisCacheAdapter } from './ioredis.adapter';
import { UpstashCacheAdapter } from './upstash.adapter';

@Module({
  providers: [
    {
      provide: 'CachePort',
      useClass:
        process.env.REDIS_PROVIDER === 'upstash'
          ? UpstashCacheAdapter
          : IORedisCacheAdapter,
    },
  ],
  exports: ['CachePort'],
})

export class CacheModule {}
