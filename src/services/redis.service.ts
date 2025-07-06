import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IRedisService } from '../interfaces/redis-service.interface';

@Injectable()
export class RedisService implements IRedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(@Inject('REDIS_CLIENT') redis: Redis) {
    this.redis = redis;
    this.setupEventHandlers();
  }

  /**
   * Set a key-value pair in Redis
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
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
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.logger.debug(`Key not found: ${key}`);
        return null;
      }

      const parsedValue = JSON.parse(value);
      this.logger.debug(`Retrieved key: ${key}`);
      return parsedValue;
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<number> {
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
   * Flush all keys from Redis
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.log('Flushed all keys from Redis');
    } catch (error) {
      this.logger.error('Failed to flush all keys', error);
      throw error;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
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

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('Reconnecting to Redis...');
    });
  }
}
