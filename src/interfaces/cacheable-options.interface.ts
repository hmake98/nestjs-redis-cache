export interface CacheableOptions {
  /**
   * Cache key (required)
   */
  key: string;

  /**
   * Time to live in seconds (optional, uses default)
   */
  ttl?: number;

  /**
   * Key scope - 'global' or 'module'
   */
  scope?: 'global' | 'module';

  /**
   * Enable JSON serialization
   */
  serialize?: boolean;
}
