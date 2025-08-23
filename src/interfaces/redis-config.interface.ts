import { RedisOptions } from 'ioredis';

/**
 * Redis connection types
 */
export type RedisConnectionType = 'standalone' | 'cluster' | 'sentinel';

/**
 * Redis SSL/TLS configuration
 */
export interface RedisTLSConfig {
  /**
   * Enable TLS/SSL connection
   */
  enabled: boolean;

  /**
   * Path to CA certificate file
   */
  ca?: string;

  /**
   * Path to client certificate file
   */
  cert?: string;

  /**
   * Path to client private key file
   */
  key?: string;

  /**
   * Reject unauthorized certificates
   * @default true
   */
  rejectUnauthorized?: boolean;

  /**
   * Server name for SNI
   */
  servername?: string;

  /**
   * Minimum TLS version
   * @default 'TLSv1.2'
   */
  minVersion?: string;

  /**
   * Maximum TLS version
   */
  maxVersion?: string;

  /**
   * List of supported ciphers
   */
  ciphers?: string;

  /**
   * Enable/disable session tickets
   */
  sessionIdContext?: string;
}

/**
 * Redis connection pool configuration
 */
export interface RedisPoolConfig {
  /**
   * Maximum number of connections in pool
   * @default 10
   */
  max?: number;

  /**
   * Minimum number of connections in pool
   * @default 2
   */
  min?: number;

  /**
   * Maximum time in milliseconds to wait for a connection
   * @default 30000
   */
  acquireTimeoutMillis?: number;

  /**
   * Maximum time in milliseconds a connection can be idle before being released
   * @default 30000
   */
  idleTimeoutMillis?: number;

  /**
   * How often to run eviction checks in milliseconds
   * @default 1000
   */
  evictionRunIntervalMillis?: number;

  /**
   * Number of connections to check during each eviction run
   * @default 3
   */
  numTestsPerEvictionRun?: number;

  /**
   * Validate connections before use
   * @default true
   */
  testOnBorrow?: boolean;

  /**
   * Validate connections when returned to pool
   * @default false
   */
  testOnReturn?: boolean;

  /**
   * Validate idle connections
   * @default true
   */
  testWhileIdle?: boolean;
}

/**
 * Redis retry strategy configuration
 */
export interface RedisRetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  retries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelayOnFailover?: number;

  /**
   * Retry delay for cluster operations
   * @default 100
   */
  retryDelayOnClusterDown?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 10000
   */
  maxRetriesPerRequest?: number;

  /**
   * Custom retry delay function
   */
  retryStrategy?: (times: number) => number | null;

  /**
   * Enable retry on timeout
   * @default true
   */
  enableRetryOnTimeout?: boolean;

  /**
   * Maximum time to wait for a command in milliseconds
   * @default 5000
   */
  commandTimeout?: number;
}

/**
 * Redis performance configuration
 */
export interface RedisPerformanceConfig {
  /**
   * Enable keep-alive for connections
   * @default true
   */
  keepAlive?: boolean;

  /**
   * TCP keep-alive delay in milliseconds
   * @default 30000
   */
  keepAliveDelay?: number;

  /**
   * Disable Nagle's algorithm
   * @default true
   */
  noDelay?: boolean;

  /**
   * Connection timeout in milliseconds
   * @default 10000
   */
  connectTimeout?: number;

  /**
   * Command timeout in milliseconds
   * @default 5000
   */
  commandTimeout?: number;

  /**
   * Enable automatic pipeline
   * @default true
   */
  enableAutoPipelining?: boolean;

  /**
   * Maximum commands to pipeline automatically
   * @default 100
   */
  maxAutoPipelineCommands?: number;

  /**
   * Enable read/write splitting for clusters
   * @default false
   */
  enableReadyCheck?: boolean;

  /**
   * Maximum memory policy
   */
  maxMemoryPolicy?: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu' | 'volatile-ttl' | 'volatile-random' | 'allkeys-random' | 'noeviction';

  /**
   * Compression settings
   */
  compression?: {
    enabled: boolean;
    algorithm?: 'gzip' | 'deflate' | 'brotli';
    threshold?: number;
  };
}

/**
 * Redis cluster node configuration
 */
export interface RedisClusterNode {
  /**
   * Node host
   */
  host: string;

  /**
   * Node port
   * @default 6379
   */
  port?: number;

  /**
   * Node password
   */
  password?: string;
}

/**
 * Redis cluster configuration
 */
export interface RedisClusterConfig {
  /**
   * Cluster nodes
   */
  nodes: RedisClusterNode[];

  /**
   * Cluster options
   */
  options?: {
    /**
     * Maximum number of redirections to follow
     * @default 16
     */
    maxRedirections?: number;

    /**
     * Enable reading from slave nodes
     * @default false
     */
    enableReadyCheck?: boolean;

    /**
     * Cluster refresh timeout in milliseconds
     * @default 5000
     */
    clusterRetryDelayOnFailover?: number;

    /**
     * Cluster retry delay when cluster is down
     * @default 100
     */
    clusterRetryDelayOnClusterDown?: number;

    /**
     * Scale reads to slave nodes
     * @default 'master'
     */
    scaleReads?: 'master' | 'slave' | 'all';

    /**
     * Custom node selector for read operations
     */
    nodeSelector?: (nodes: RedisClusterNode[], command: string) => RedisClusterNode;
  };
}

/**
 * Redis Sentinel node configuration
 */
export interface RedisSentinelNode {
  /**
   * Sentinel host
   */
  host: string;

  /**
   * Sentinel port
   * @default 26379
   */
  port?: number;

  /**
   * Sentinel password
   */
  password?: string;
}

/**
 * Redis Sentinel configuration
 */
export interface RedisSentinelConfig {
  /**
   * Sentinel nodes
   */
  sentinels: RedisSentinelNode[];

  /**
   * Name of the Redis master
   */
  name: string;

  /**
   * Sentinel options
   */
  options?: {
    /**
     * Sentinel password
     */
    sentinelPassword?: string;

    /**
     * Enable reading from slave nodes
     * @default false
     */
    enableReadyCheck?: boolean;

    /**
     * Sentinel retry delay in milliseconds
     * @default 200
     */
    sentinelRetryDelayOnFailover?: number;

    /**
     * Role to connect to
     * @default 'master'
     */
    role?: 'master' | 'slave';

    /**
     * Preferred slave selector
     */
    preferredSlaves?: Array<{ ip: string; port: number; prio?: number }> | ((slaves: Array<{ ip: string; port: number }>) => { ip: string; port: number });
  };
}

/**
 * Redis monitoring and observability configuration
 */
export interface RedisMonitoringConfig {
  /**
   * Enable connection monitoring
   * @default true
   */
  enableConnectionMonitoring?: boolean;

  /**
   * Enable command monitoring
   * @default false
   */
  enableCommandMonitoring?: boolean;

  /**
   * Enable slow log monitoring
   * @default true
   */
  enableSlowLogMonitoring?: boolean;

  /**
   * Slow log threshold in microseconds
   * @default 10000
   */
  slowLogThreshold?: number;

  /**
   * Enable memory usage monitoring
   * @default true
   */
  enableMemoryMonitoring?: boolean;

  /**
   * Memory check interval in milliseconds
   * @default 60000
   */
  memoryCheckInterval?: number;

  /**
   * Custom metrics collector
   */
  metricsCollector?: {
    collectConnectionMetrics?: boolean;
    collectCommandMetrics?: boolean;
    collectErrorMetrics?: boolean;
    customTags?: Record<string, string>;
  };
}

/**
 * Redis security configuration
 */
export interface RedisSecurityConfig {
  /**
   * Redis AUTH password
   */
  password?: string;

  /**
   * Redis AUTH username (Redis 6.0+)
   */
  username?: string;

  /**
   * Database number to select
   * @default 0
   */
  db?: number;

  /**
   * Enable/disable certain commands
   */
  commandBlacklist?: string[];

  /**
   * Enable/disable dangerous commands
   * @default true
   */
  disableDangerousCommands?: boolean;

  /**
   * Custom ACL rules (Redis 6.0+)
   */
  aclRules?: string[];

  /**
   * Connection rate limiting
   */
  rateLimiting?: {
    enabled: boolean;
    maxConnections?: number;
    windowMs?: number;
  };
}

/**
 * Comprehensive Redis configuration interface
 */
export interface AdvancedRedisConfig {
  /**
   * Connection type
   * @default 'standalone'
   */
  type?: RedisConnectionType;

  /**
   * Redis connection URL (for standalone)
   */
  url?: string;

  /**
   * Redis host (for standalone)
   */
  host?: string;

  /**
   * Redis port (for standalone)
   * @default 6379
   */
  port?: number;

  /**
   * Key prefix for all cache keys
   */
  keyPrefix?: string;

  /**
   * Default TTL in seconds
   */
  defaultTtl?: number;

  /**
   * Enable logging
   * @default true
   */
  enableLogging?: boolean;

  /**
   * Security configuration
   */
  security?: RedisSecurityConfig;

  /**
   * TLS/SSL configuration
   */
  tls?: RedisTLSConfig;

  /**
   * Connection pool configuration
   */
  pool?: RedisPoolConfig;

  /**
   * Retry strategy configuration
   */
  retry?: RedisRetryConfig;

  /**
   * Performance configuration
   */
  performance?: RedisPerformanceConfig;

  /**
   * Cluster configuration (when type is 'cluster')
   */
  cluster?: RedisClusterConfig;

  /**
   * Sentinel configuration (when type is 'sentinel')
   */
  sentinel?: RedisSentinelConfig;

  /**
   * Monitoring configuration
   */
  monitoring?: RedisMonitoringConfig;

  /**
   * Custom Redis options (will be merged with generated options)
   */
  customOptions?: Partial<RedisOptions>;

  /**
   * Environment-specific overrides
   */
  environment?: {
    development?: Partial<AdvancedRedisConfig>;
    staging?: Partial<AdvancedRedisConfig>;
    production?: Partial<AdvancedRedisConfig>;
    test?: Partial<AdvancedRedisConfig>;
  };
}

/**
 * Redis configuration presets for common use cases
 */
export interface RedisConfigPresets {
  /**
   * Development environment preset
   */
  development: Partial<AdvancedRedisConfig>;

  /**
   * Testing environment preset
   */
  testing: Partial<AdvancedRedisConfig>;

  /**
   * Production environment preset
   */
  production: Partial<AdvancedRedisConfig>;

  /**
   * High availability preset
   */
  highAvailability: Partial<AdvancedRedisConfig>;

  /**
   * High performance preset
   */
  highPerformance: Partial<AdvancedRedisConfig>;

  /**
   * Memory optimized preset
   */
  memoryOptimized: Partial<AdvancedRedisConfig>;
}