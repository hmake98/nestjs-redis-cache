import { Redis } from 'ioredis';

/**
 * Redis client type
 */
export type RedisClient = Redis;

/**
 * Redis connection options
 */
export interface RedisConnectionOptions {
  url: string;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}
