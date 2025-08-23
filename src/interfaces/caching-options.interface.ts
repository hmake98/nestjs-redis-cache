import { AdvancedRedisConfig } from './redis-config.interface';

export interface CachingOptions {
  /**
   * Redis connection URL (simple configuration)
   * @deprecated Use 'redis' property for advanced configuration
   */
  redisUrl?: string;

  /**
   * Advanced Redis configuration
   */
  redis?: AdvancedRedisConfig;

  /**
   * Global key prefix for all cache keys
   * @deprecated Use redis.keyPrefix instead
   */
  keyPrefix?: string;

  /**
   * Default TTL in seconds for cached items
   * @deprecated Use redis.defaultTtl instead
   */
  defaultTtl?: number;

  /**
   * Enable global logger integration
   * @deprecated Use redis.enableLogging instead
   */
  logger?: boolean;
}

export interface AsyncCachingOptions {
  /**
   * Factory function to create caching options
   */
  useFactory: (...args: any[]) => CachingOptions | Promise<CachingOptions>;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];

  /**
   * Optional modules to import for DI context
   */
  imports?: any[];
}
