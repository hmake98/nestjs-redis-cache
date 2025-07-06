/**
 * Entry point for nestjs-redis-cache public API
 */
export { CachingModule } from './caching.module';

// Services
export { RedisService } from './services/redis.service';

// Decorators
export { Cacheable } from './decorators/cacheable.decorator';

// Interfaces
export type {
  CachingOptions,
  AsyncCachingOptions,
} from './interfaces/caching-options.interface';
export type { CacheableOptions } from './interfaces/cacheable-options.interface';
export type { IRedisService } from './interfaces/redis-service.interface';

// Types
export type { CacheScope } from './types/cache-scope.type';
export type {
  RedisClient,
  RedisConnectionOptions,
} from './types/redis-connection.type';

// Utilities
export {
  generateCacheKey,
  generatePrefixedCacheKey,
} from './utils/key-generator.util';
