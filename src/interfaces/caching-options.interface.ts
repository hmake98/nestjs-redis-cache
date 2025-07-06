export interface CachingOptions {
  /**
   * Redis connection URL
   */
  redisUrl: string;

  /**
   * Global key prefix for all cache keys
   */
  keyPrefix?: string;

  /**
   * Default TTL in seconds for cached items
   */
  defaultTtl?: number;

  /**
   * Enable global logger integration
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
