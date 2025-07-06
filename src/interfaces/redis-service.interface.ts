export interface IRedisService {
  /**
   * Set a key-value pair in Redis
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Get a value from Redis by key
   */
  get(key: string): Promise<any>;

  /**
   * Delete a key from Redis
   */
  del(key: string): Promise<number>;

  /**
   * Check if a key exists in Redis
   */
  hasKey(key: string): Promise<boolean>;

  /**
   * Flush all keys from Redis
   */
  flushAll(): Promise<void>;

  /**
   * Get all keys matching a pattern
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Get the TTL of a key
   */
  ttl(key: string): Promise<number>;

  /**
   * Set the TTL of a key
   */
  expire(key: string, ttl: number): Promise<boolean>;

  /**
   * Increment a numeric value
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Decrement a numeric value
   */
  decrement(key: string, amount?: number): Promise<number>;
} 
