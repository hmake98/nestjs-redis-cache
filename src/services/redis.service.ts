import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IRedisService } from '../interfaces/redis-service.interface';

@Injectable()
export class RedisService implements IRedisService, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  // istanbul ignore next
  constructor(@Inject('REDIS_CLIENT') redis: Redis) {
    this.redis = redis;
    this.setupEventHandlers();
  }

  /**
   * Graceful shutdown for Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Shutting down Redis connection...');
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error('Error during Redis shutdown', error);
      // Force disconnect if graceful shutdown fails
      this.redis.disconnect();
    }
  }

  /**
   * Set a key-value pair in Redis
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    try {
      let serializedValue: string;

      try {
        serializedValue = JSON.stringify(value);
      } catch (serializationError) {
        this.logger.error(
          `JSON serialization failed for key: ${key}`,
          serializationError,
        );
        throw new Error(`Failed to serialize value for key: ${key}`);
      }

      if (ttl !== undefined) {
        if (typeof ttl !== 'number' || ttl <= 0) {
          throw new Error('TTL must be a positive number');
        }
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      this.logger.debug(`Set key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to set key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get a value from Redis by key
   */
  async get(key: string): Promise<any> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.logger.debug(`Key not found: ${key}`);
        return null;
      }

      try {
        const parsedValue = JSON.parse(value);
        this.logger.debug(`Retrieved key: ${key}`);
        return parsedValue;
      } catch (parseError) {
        this.logger.error(`JSON parsing failed for key: ${key}`, parseError);
        throw new Error(`Failed to parse value for key: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    try {
      const result = await this.redis.del(key);
      this.logger.debug(`Deleted key: ${key}, result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async hasKey(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    try {
      const exists = await this.redis.exists(key);
      this.logger.debug(`Key exists check: ${key}, result: ${exists}`);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check key existence: ${key}`, error);
      throw error;
    }
  }

  /**
   * Flush all data from Redis
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.log('Flushed all Redis data');
    } catch (error) {
      this.logger.error('Failed to flush Redis data', error);
      throw error;
    }
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!pattern || typeof pattern !== 'string') {
      throw new Error('Pattern must be a non-empty string');
    }

    try {
      const keys = await this.redis.keys(pattern);
      this.logger.debug(
        `Retrieved keys with pattern: ${pattern}, count: ${keys.length}`,
      );
      return keys;
    } catch (error) {
      this.logger.error(`Failed to get keys with pattern: ${pattern}`, error);
      throw error;
    }
  }

  /**
   * Get the TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    try {
      const ttl = await this.redis.ttl(key);
      this.logger.debug(`TTL for key: ${key}, ttl: ${ttl}`);
      return ttl;
    } catch (error) {
      this.logger.error(`Failed to get TTL for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Set the TTL of a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    if (typeof ttl !== 'number' || ttl <= 0) {
      throw new Error('TTL must be a positive number');
    }

    try {
      const result = await this.redis.expire(key, ttl);
      this.logger.debug(
        `Set TTL for key: ${key}, ttl: ${ttl}, result: ${result}`,
      );
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set TTL for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      throw new Error('Amount must be an integer');
    }

    try {
      const result = await this.redis.incrby(key, amount);
      this.logger.debug(
        `Incremented key: ${key}, amount: ${amount}, result: ${result}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to increment key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      throw new Error('Amount must be an integer');
    }

    try {
      const result = await this.redis.decrby(key, amount);
      this.logger.debug(
        `Decremented key: ${key}, amount: ${amount}, result: ${result}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to decrement key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get the underlying Redis client
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', (delay) => {
      this.logger.log(`Reconnecting to Redis in ${delay}ms...`);
    });

    this.redis.on('end', () => {
      this.logger.warn('Redis connection ended');
    });
  }
}
