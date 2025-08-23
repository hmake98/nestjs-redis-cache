export interface IRedisService {
  // === Core String Operations ===
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

  /**
   * Flush all keys from Redis
   */
  flushAll(): Promise<void>;

  // === Hash Operations ===
  /**
   * Set a field in a hash
   */
  hSet(key: string, field: string, value: any): Promise<number>;

  /**
   * Get a field from a hash
   */
  hGet(key: string, field: string): Promise<any>;

  /**
   * Delete a field from a hash
   */
  hDel(key: string, field: string): Promise<number>;

  /**
   * Check if a field exists in a hash
   */
  hExists(key: string, field: string): Promise<boolean>;

  /**
   * Get all fields and values from a hash
   */
  hGetAll(key: string): Promise<Record<string, any>>;

  /**
   * Get all fields from a hash
   */
  hKeys(key: string): Promise<string[]>;

  /**
   * Get all values from a hash
   */
  hVals(key: string): Promise<any[]>;

  /**
   * Get the number of fields in a hash
   */
  hLen(key: string): Promise<number>;

  /**
   * Set multiple fields in a hash
   */
  hMSet(key: string, data: Record<string, any>): Promise<void>;

  /**
   * Get multiple fields from a hash
   */
  hMGet(key: string, fields: string[]): Promise<any[]>;

  // === List Operations ===
  /**
   * Push values to the left (head) of a list
   */
  lPush(key: string, ...values: any[]): Promise<number>;

  /**
   * Push values to the right (tail) of a list
   */
  rPush(key: string, ...values: any[]): Promise<number>;

  /**
   * Pop a value from the left (head) of a list
   */
  lPop(key: string): Promise<any>;

  /**
   * Pop a value from the right (tail) of a list
   */
  rPop(key: string): Promise<any>;

  /**
   * Get the length of a list
   */
  lLen(key: string): Promise<number>;

  /**
   * Get a range of elements from a list
   */
  lRange(key: string, start: number, stop: number): Promise<any[]>;

  /**
   * Get an element from a list by index
   */
  lIndex(key: string, index: number): Promise<any>;

  /**
   * Set an element in a list by index
   */
  lSet(key: string, index: number, value: any): Promise<void>;

  /**
   * Remove elements from a list
   */
  lRem(key: string, count: number, value: any): Promise<number>;

  /**
   * Trim a list to a specified range
   */
  lTrim(key: string, start: number, stop: number): Promise<void>;

  // === Set Operations ===
  /**
   * Add members to a set
   */
  sAdd(key: string, ...members: any[]): Promise<number>;

  /**
   * Remove members from a set
   */
  sRem(key: string, ...members: any[]): Promise<number>;

  /**
   * Check if a member exists in a set
   */
  sIsMember(key: string, member: any): Promise<boolean>;

  /**
   * Get all members of a set
   */
  sMembers(key: string): Promise<any[]>;

  /**
   * Get the number of members in a set
   */
  sCard(key: string): Promise<number>;

  /**
   * Get random members from a set
   */
  sRandMember(key: string, count?: number): Promise<any[]>;

  /**
   * Pop a random member from a set
   */
  sPop(key: string, count?: number): Promise<any[]>;

  /**
   * Get the intersection of multiple sets
   */
  sInter(keys: string[]): Promise<any[]>;

  /**
   * Get the union of multiple sets
   */
  sUnion(keys: string[]): Promise<any[]>;

  /**
   * Get the difference between sets
   */
  sDiff(keys: string[]): Promise<any[]>;

  // === Sorted Set Operations ===
  /**
   * Add members to a sorted set with scores
   */
  zAdd(key: string, ...scoreMembers: Array<{ score: number; member: any }>): Promise<number>;

  /**
   * Remove members from a sorted set
   */
  zRem(key: string, ...members: any[]): Promise<number>;

  /**
   * Get a range of members from a sorted set by rank
   */
  zRange(key: string, start: number, stop: number, withScores?: boolean): Promise<any[]>;

  /**
   * Get a range of members from a sorted set by score
   */
  zRangeByScore(key: string, min: number | string, max: number | string, withScores?: boolean): Promise<any[]>;

  /**
   * Get the rank of a member in a sorted set
   */
  zRank(key: string, member: any): Promise<number | null>;

  /**
   * Get the score of a member in a sorted set
   */
  zScore(key: string, member: any): Promise<number | null>;

  /**
   * Get the number of members in a sorted set
   */
  zCard(key: string): Promise<number>;

  /**
   * Count members in a sorted set within a score range
   */
  zCount(key: string, min: number | string, max: number | string): Promise<number>;

  /**
   * Increment the score of a member in a sorted set
   */
  zIncrBy(key: string, increment: number, member: any): Promise<number>;

  // === Advanced Operations ===
  /**
   * Scan keys with a pattern (better than KEYS for large datasets)
   */
  scan(cursor: string, pattern?: string, count?: number): Promise<{ cursor: string; keys: string[] }>;

  /**
   * Get multiple keys at once
   */
  mGet(keys: string[]): Promise<any[]>;

  /**
   * Set multiple keys at once
   */
  mSet(keyValues: Record<string, any>): Promise<void>;

  /**
   * Set a key only if it doesn't exist
   */
  setNX(key: string, value: any, ttl?: number): Promise<boolean>;

  /**
   * Get and set a key atomically
   */
  getSet(key: string, value: any): Promise<any>;

  /**
   * Execute multiple commands in a transaction
   */
  multi(commands: Array<{ command: string; args: any[] }>): Promise<any[]>;

  /**
   * Execute multiple commands in a pipeline (faster than individual commands)
   */
  pipeline(commands: Array<{ command: string; args: any[] }>): Promise<any[]>;
}
