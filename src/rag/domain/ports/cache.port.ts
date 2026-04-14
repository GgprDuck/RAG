export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  deleteByPattern?(pattern: string): Promise<void>;
}