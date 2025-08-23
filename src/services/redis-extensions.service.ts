import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * Extended Redis operations for sets, sorted sets, and advanced functionality
 */
@Injectable()
export class RedisExtensionsService {
  private readonly logger = new Logger(RedisExtensionsService.name);

  // === Set Operations ===

  /**
   * Add members to a set
   */
  async sAdd(redis: Redis, key: string, ...members: any[]): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (members.length === 0) {
      throw new Error('At least one member must be provided');
    }

    const startTime = Date.now();
    this.logger.debug(`Adding members to set: ${key} - ${members.length} members`);

    try {
      const serializedMembers = members.map(member => JSON.stringify(member));
      const added = await redis.sadd(key, ...serializedMembers);
      const duration = Date.now() - startTime;
      this.logger.debug(`Successfully added ${added} new members to set: ${key} (${duration}ms)`);
      return added;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to add members to set: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Remove members from a set
   */
  async sRem(redis: Redis, key: string, ...members: any[]): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (members.length === 0) {
      throw new Error('At least one member must be provided');
    }

    const startTime = Date.now();
    this.logger.debug(`Removing members from set: ${key} - ${members.length} members`);

    try {
      const serializedMembers = members.map(member => JSON.stringify(member));
      const removed = await redis.srem(key, ...serializedMembers);
      const duration = Date.now() - startTime;
      this.logger.debug(`Successfully removed ${removed} members from set: ${key} (${duration}ms)`);
      return removed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to remove members from set: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Check if a member exists in a set
   */
  async sIsMember(redis: Redis, key: string, member: any): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    const startTime = Date.now();
    this.logger.debug(`Checking set membership: ${key}`);

    try {
      const serializedMember = JSON.stringify(member);
      const isMember = await redis.sismember(key, serializedMember);
      const duration = Date.now() - startTime;
      this.logger.debug(`Set membership check: ${key} - ${isMember ? 'member exists' : 'member not found'} (${duration}ms)`);
      return isMember === 1;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to check set membership: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get all members of a set
   */
  async sMembers(redis: Redis, key: string): Promise<any[]> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting set members: ${key}`);

    try {
      const members = await redis.smembers(key);
      const duration = Date.now() - startTime;
      
      const parsed = members.map((member, index) => {
        try {
          return JSON.parse(member);
        } catch {
          this.logger.warn(`Failed to parse member at index ${index} from set ${key}, returning raw value`);
          return member;
        }
      });

      this.logger.debug(`Successfully retrieved set members: ${key} - ${parsed.length} members (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get set members: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get the number of members in a set
   */
  async sCard(redis: Redis, key: string): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting set cardinality: ${key}`);

    try {
      const count = await redis.scard(key);
      const duration = Date.now() - startTime;
      this.logger.debug(`Set cardinality: ${key} - ${count} members (${duration}ms)`);
      return count;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get set cardinality: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get random members from a set
   */
  async sRandMember(redis: Redis, key: string, count?: number): Promise<any[]> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting random set members: ${key}${count ? ` - count: ${count}` : ''}`);

    try {
      const members = count !== undefined 
        ? await redis.srandmember(key, count)
        : [await redis.srandmember(key)].filter(m => m !== null);
      
      const duration = Date.now() - startTime;
      
      const parsed = members.map((member, index) => {
        if (member === null) return null;
        try {
          return JSON.parse(member);
        } catch {
          this.logger.warn(`Failed to parse random member at index ${index} from set ${key}, returning raw value`);
          return member;
        }
      });

      this.logger.debug(`Successfully retrieved random set members: ${key} - ${parsed.length} members (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get random set members: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Pop a random member from a set
   */
  async sPop(redis: Redis, key: string, count?: number): Promise<any[]> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    const startTime = Date.now();
    this.logger.debug(`Popping random set members: ${key}${count ? ` - count: ${count}` : ''}`);

    try {
      const members = count !== undefined 
        ? await redis.spop(key, count)
        : [await redis.spop(key)].filter(m => m !== null);
      
      const duration = Date.now() - startTime;
      
      const parsed = members.map((member, index) => {
        if (member === null) return null;
        try {
          return JSON.parse(member);
        } catch {
          this.logger.warn(`Failed to parse popped member at index ${index} from set ${key}, returning raw value`);
          return member;
        }
      });

      this.logger.debug(`Successfully popped random set members: ${key} - ${parsed.length} members (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to pop random set members: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get the intersection of multiple sets
   */
  async sInter(redis: Redis, keys: string[]): Promise<any[]> {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('Keys must be a non-empty array');
    }
    if (keys.some(k => typeof k !== 'string' || k.length === 0)) {
      throw new Error('All keys must be non-empty strings');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting set intersection: [${keys.join(', ')}]`);

    try {
      const members = await redis.sinter(...keys);
      const duration = Date.now() - startTime;
      
      const parsed = members.map((member, index) => {
        try {
          return JSON.parse(member);
        } catch {
          this.logger.warn(`Failed to parse intersection member at index ${index}, returning raw value`);
          return member;
        }
      });

      this.logger.debug(`Successfully retrieved set intersection: [${keys.join(', ')}] - ${parsed.length} members (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get set intersection: [${keys.join(', ')}] after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get the union of multiple sets
   */
  async sUnion(redis: Redis, keys: string[]): Promise<any[]> {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('Keys must be a non-empty array');
    }
    if (keys.some(k => typeof k !== 'string' || k.length === 0)) {
      throw new Error('All keys must be non-empty strings');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting set union: [${keys.join(', ')}]`);

    try {
      const members = await redis.sunion(...keys);
      const duration = Date.now() - startTime;
      
      /* istanbul ignore next */
      const parsed = members.map((member, index) => {
        try {
          return JSON.parse(member);
        } catch {
          this.logger.warn(`Failed to parse union member at index ${index}, returning raw value`);
          return member;
        }
      });

      this.logger.debug(`Successfully retrieved set union: [${keys.join(', ')}] - ${parsed.length} members (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get set union: [${keys.join(', ')}] after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get the difference between sets
   */
  async sDiff(redis: Redis, keys: string[]): Promise<any[]> {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('Keys must be a non-empty array');
    }
    if (keys.some(k => typeof k !== 'string' || k.length === 0)) {
      throw new Error('All keys must be non-empty strings');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting set difference: [${keys.join(', ')}]`);

    try {
      const members = await redis.sdiff(...keys);
      const duration = Date.now() - startTime;
      
      const parsed = members.map((member, index) => {
        try {
          return JSON.parse(member);
        } catch {
          this.logger.warn(`Failed to parse difference member at index ${index}, returning raw value`);
          return member;
        }
      });

      this.logger.debug(`Successfully retrieved set difference: [${keys.join(', ')}] - ${parsed.length} members (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get set difference: [${keys.join(', ')}] after ${duration}ms`, error);
      throw error;
    }
  }

  // === Sorted Set Operations ===

  /**
   * Add members to a sorted set with scores
   */
  async zAdd(redis: Redis, key: string, ...scoreMembers: { score: number; member: any }[]): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (scoreMembers.length === 0) {
      throw new Error('At least one score-member pair must be provided');
    }

    const startTime = Date.now();
    this.logger.debug(`Adding members to sorted set: ${key} - ${scoreMembers.length} members`);

    try {
      const args: any[] = [];
      for (const { score, member } of scoreMembers) {
        if (typeof score !== 'number') {
          throw new Error('Score must be a number');
        }
        args.push(score, JSON.stringify(member));
      }

      const added = await (redis as any).zadd(key, ...args);
      const duration = Date.now() - startTime;
      this.logger.debug(`Successfully added ${added} new members to sorted set: ${key} (${duration}ms)`);
      return added;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to add members to sorted set: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Remove members from a sorted set
   */
  async zRem(redis: Redis, key: string, ...members: any[]): Promise<number> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (members.length === 0) {
      throw new Error('At least one member must be provided');
    }

    const startTime = Date.now();
    this.logger.debug(`Removing members from sorted set: ${key} - ${members.length} members`);

    try {
      const serializedMembers = members.map(member => JSON.stringify(member));
      const removed = await redis.zrem(key, ...serializedMembers);
      const duration = Date.now() - startTime;
      this.logger.debug(`Successfully removed ${removed} members from sorted set: ${key} (${duration}ms)`);
      return removed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to remove members from sorted set: ${key} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get a range of members from a sorted set by rank
   */
  async zRange(redis: Redis, key: string, start: number, stop: number, withScores = false): Promise<any[]> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (typeof start !== 'number' || typeof stop !== 'number') {
      throw new Error('Start and stop must be numbers');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting sorted set range: ${key} [${start}:${stop}]${withScores ? ' with scores' : ''}`);

    try {
      const result = withScores 
        ? await redis.zrange(key, start, stop, 'WITHSCORES')
        : await redis.zrange(key, start, stop);
      
      const duration = Date.now() - startTime;
      
      if (withScores) {
        const parsed: any[] = [];
        for (let i = 0; i < result.length; i += 2) {
          try {
            parsed.push({
              member: JSON.parse(result[i]),
              score: parseFloat(result[i + 1])
            });
          } catch {
            this.logger.warn(`Failed to parse sorted set member at index ${i}, returning raw value`);
            parsed.push({
              member: result[i],
              score: parseFloat(result[i + 1])
            });
          }
        }
        this.logger.debug(`Successfully retrieved sorted set range with scores: ${key} [${start}:${stop}] - ${parsed.length} members (${duration}ms)`);
        return parsed;
      } else {
        const parsed = result.map((member, index) => {
          try {
            return JSON.parse(member);
          } catch {
            this.logger.warn(`Failed to parse sorted set member at index ${index}, returning raw value`);
            return member;
          }
        });
        this.logger.debug(`Successfully retrieved sorted set range: ${key} [${start}:${stop}] - ${parsed.length} members (${duration}ms)`);
        return parsed;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get sorted set range: ${key} [${start}:${stop}] after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get a range of members from a sorted set by score
   */
  async zRangeByScore(redis: Redis, key: string, min: number | string, max: number | string, withScores = false): Promise<any[]> {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting sorted set range by score: ${key} [${min}:${max}]${withScores ? ' with scores' : ''}`);

    try {
      const result = withScores 
        ? await redis.zrangebyscore(key, min, max, 'WITHSCORES')
        : await redis.zrangebyscore(key, min, max);
      
      const duration = Date.now() - startTime;
      
      if (withScores) {
        const parsed: any[] = [];
        for (let i = 0; i < result.length; i += 2) {
          try {
            parsed.push({
              member: JSON.parse(result[i]),
              score: parseFloat(result[i + 1])
            });
          } catch {
            this.logger.warn(`Failed to parse sorted set member at index ${i}, returning raw value`);
            parsed.push({
              member: result[i],
              score: parseFloat(result[i + 1])
            });
          }
        }
        this.logger.debug(`Successfully retrieved sorted set range by score with scores: ${key} [${min}:${max}] - ${parsed.length} members (${duration}ms)`);
        return parsed;
      } else {
        const parsed = result.map((member, index) => {
          try {
            return JSON.parse(member);
          } catch {
            this.logger.warn(`Failed to parse sorted set member at index ${index}, returning raw value`);
            return member;
          }
        });
        this.logger.debug(`Successfully retrieved sorted set range by score: ${key} [${min}:${max}] - ${parsed.length} members (${duration}ms)`);
        return parsed;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get sorted set range by score: ${key} [${min}:${max}] after ${duration}ms`, error);
      throw error;
    }
  }

  // === Advanced Operations ===

  /**
   * Scan keys with a pattern (better than KEYS for large datasets)
   */
  async scan(redis: Redis, cursor: string, pattern?: string, count?: number): Promise<{ cursor: string; keys: string[] }> {
    if (!cursor || typeof cursor !== 'string') {
      throw new Error('Cursor must be a non-empty string');
    }
    if (count !== undefined && (typeof count !== 'number' || count <= 0)) {
      throw new Error('Count must be a positive number');
    }

    const startTime = Date.now();
    this.logger.debug(`Scanning keys - cursor: ${cursor}${pattern ? `, pattern: ${pattern}` : ''}${count ? `, count: ${count}` : ''}`);

    try {
      const args: any[] = [cursor];
      if (pattern) {
        args.push('MATCH', pattern);
      }
      if (count) {
        args.push('COUNT', count);
      }

      /* istanbul ignore next */
      const result: any = await (redis as any).scan(...args);
      /* istanbul ignore next */
      const newCursor: string = Array.isArray(result) ? result[0] : result?.[0];
      /* istanbul ignore next */
      const keys: string[] = Array.isArray(result) ? result[1] : result?.[1];
      const duration = Date.now() - startTime;
      this.logger.debug(`Successfully scanned keys - new cursor: ${newCursor}, found: ${keys.length} keys (${duration}ms)`);
      
      return { cursor: newCursor, keys };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to scan keys after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mGet(redis: Redis, keys: string[]): Promise<any[]> {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('Keys must be a non-empty array');
    }

    const startTime = Date.now();
    this.logger.debug(`Getting multiple keys: ${keys.length} keys`);

    try {
      const values = await redis.mget(...keys);
      const duration = Date.now() - startTime;
      
      const parsed = values.map((value, index) => {
        if (value === null) return null;
        
        try {
          return JSON.parse(value);
        } catch {
          this.logger.warn(`Failed to parse value for key ${keys[index]}, returning raw value`);
          return value;
        }
      });

      this.logger.debug(`Successfully retrieved multiple keys: ${keys.length} keys (${duration}ms)`);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get multiple keys after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Set multiple keys at once
   */
  async mSet(redis: Redis, keyValues: Record<string, any>): Promise<void> {
    if (!keyValues || typeof keyValues !== 'object') {
      throw new Error('KeyValues must be an object');
    }

    const entries = Object.entries(keyValues);
    if (entries.length === 0) {
      throw new Error('At least one key-value pair must be provided');
    }

    const startTime = Date.now();
    this.logger.debug(`Setting multiple keys: ${entries.length} keys`);

    try {
      const args: string[] = [];
      for (const [key, value] of entries) {
        args.push(key, JSON.stringify(value));
      }

      await redis.mset(...args);
      const duration = Date.now() - startTime;
      this.logger.debug(`Successfully set multiple keys: ${entries.length} keys (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to set multiple keys after ${duration}ms`, error);
      throw error;
    }
  }
}
