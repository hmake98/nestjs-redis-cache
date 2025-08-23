import { RedisOptions } from 'ioredis';
import {
  AdvancedRedisConfig,
  RedisConnectionType,
  RedisConfigPresets,
  RedisClusterConfig,
  RedisSentinelConfig,
  RedisTLSConfig,
  RedisSecurityConfig,
  RedisPerformanceConfig,
  RedisRetryConfig,
  RedisPoolConfig,
  RedisMonitoringConfig,
} from '../interfaces/redis-config.interface';

/**
 * Redis configuration builder for fluent API configuration
 */
export class RedisConfigBuilder {
  private config: AdvancedRedisConfig = {};

  /**
   * Set connection type
   */
  setConnectionType(type: RedisConnectionType): this {
    this.config.type = type;
    return this;
  }

  /**
   * Set standalone Redis connection
   */
  setStandalone(urlOrOptions: string | { host: string; port?: number }): this {
    this.config.type = 'standalone';
    
    if (typeof urlOrOptions === 'string') {
      this.config.url = urlOrOptions;
    } else {
      this.config.host = urlOrOptions.host;
      this.config.port = urlOrOptions.port || 6379;
    }
    
    return this;
  }

  // Fluent alias methods to match tests
  standalone(): this {
    this.config.type = 'standalone';
    return this;
  }

  host(hostname: string): this {
    this.config.host = hostname;
    return this;
  }

  port(port: number): this {
    this.config.port = port;
    return this;
  }

  keyPrefix(prefix: string): this {
    this.config.keyPrefix = prefix;
    return this;
  }

  defaultTtl(ttl: number): this {
    this.config.defaultTtl = ttl;
    return this;
  }

  disableLogging(): this {
    this.config.enableLogging = false;
    return this;
  }

  performance(config: RedisPerformanceConfig): this {
    this.config.performance = config;
    return this;
  }

  security(config: RedisSecurityConfig): this {
    this.config.security = config;
    return this;
  }

  /**
   * Set cluster configuration
   */
  setCluster(config: RedisClusterConfig): this {
    this.config.type = 'cluster';
    this.config.cluster = config;
    return this;
  }

  /**
   * Set sentinel configuration
   */
  setSentinel(config: RedisSentinelConfig): this {
    this.config.type = 'sentinel';
    this.config.sentinel = config;
    return this;
  }

  /**
   * Set key prefix
   */
  setKeyPrefix(prefix: string): this {
    this.config.keyPrefix = prefix;
    return this;
  }

  /**
   * Set default TTL
   */
  setDefaultTtl(ttl: number): this {
    this.config.defaultTtl = ttl;
    return this;
  }

  /**
   * Enable/disable logging
   */
  setLogging(enabled: boolean): this {
    this.config.enableLogging = enabled;
    return this;
  }

  /**
   * Set security configuration
   */
  setSecurity(config: RedisSecurityConfig): this {
    this.config.security = config;
    return this;
  }

  /**
   * Set TLS configuration
   */
  setTLS(config: RedisTLSConfig): this {
    this.config.tls = config;
    return this;
  }

  /**
   * Set connection pool configuration
   */
  setPool(config: RedisPoolConfig): this {
    this.config.pool = config;
    return this;
  }

  /**
   * Set retry configuration
   */
  setRetry(config: RedisRetryConfig): this {
    this.config.retry = config;
    return this;
  }

  /**
   * Set performance configuration
   */
  setPerformance(config: RedisPerformanceConfig): this {
    this.config.performance = config;
    return this;
  }

  /**
   * Set monitoring configuration
   */
  setMonitoring(config: RedisMonitoringConfig): this {
    this.config.monitoring = config;
    return this;
  }

  /**
   * Set custom Redis options
   */
  setCustomOptions(options: Partial<RedisOptions>): this {
    this.config.customOptions = options;
    return this;
  }

  /**
   * Add environment-specific configuration
   */
  addEnvironmentConfig(env: string, config: Partial<AdvancedRedisConfig>): this {
    if (!this.config.environment) {
      this.config.environment = {};
    }
    (this.config.environment as any)[env] = config;
    return this;
  }

  /**
   * Apply a configuration preset
   */
  applyPreset(preset: keyof RedisConfigPresets): this {
    const presets = getRedisConfigPresets();
    const presetConfig = presets[preset];
    
    if (presetConfig) {
      this.config = this.mergeConfigs(this.config, presetConfig);
    }
    
    return this;
  }

  /**
   * Merge with another configuration
   */
  merge(other: Partial<AdvancedRedisConfig>): this {
    this.config = this.mergeConfigs(this.config, other);
    return this;
  }

  /**
   * Build the final configuration
   */
  build(): AdvancedRedisConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.config = {};
    return this;
  }

  /**
   * Deep merge two configurations
   */
  private mergeConfigs(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfigs(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

/**
 * Redis configuration presets
 */
export function getRedisConfigPresets(): RedisConfigPresets {
  return {
    development: {
      type: 'standalone',
      host: 'localhost',
      port: 6379,
      enableLogging: true,
      performance: {
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableAutoPipelining: false,
      },
      retry: {
        retries: 2,
        retryDelayOnFailover: 100,
      },
      monitoring: {
        enableConnectionMonitoring: true,
        enableCommandMonitoring: true,
        enableSlowLogMonitoring: true,
      },
    },

    testing: {
      type: 'standalone',
      host: 'localhost',
      port: 6379,
      enableLogging: false,
      performance: {
        connectTimeout: 1000,
        commandTimeout: 1000,
        enableAutoPipelining: false,
      },
      retry: {
        retries: 0,
        maxRetriesPerRequest: 1,
      },
      monitoring: {
        enableConnectionMonitoring: false,
        enableCommandMonitoring: false,
        enableSlowLogMonitoring: false,
      },
    },

    production: {
      type: 'standalone',
      enableLogging: true,
      performance: {
        keepAlive: true,
        keepAliveDelay: 30000,
        noDelay: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableAutoPipelining: true,
        maxAutoPipelineCommands: 100,
      },
      retry: {
        retries: 3,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        enableRetryOnTimeout: true,
      },
      pool: {
        max: 20,
        min: 5,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        testOnBorrow: true,
        testWhileIdle: true,
      },
      monitoring: {
        enableConnectionMonitoring: true,
        enableCommandMonitoring: false,
        enableSlowLogMonitoring: true,
        slowLogThreshold: 10000,
        enableMemoryMonitoring: true,
      },
      security: {
        disableDangerousCommands: true,
      },
    },

    highAvailability: {
      type: 'sentinel',
      performance: {
        keepAlive: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableReadyCheck: true,
      },
      retry: {
        retries: 5,
        retryDelayOnFailover: 2000,
        maxRetriesPerRequest: 5,
        enableRetryOnTimeout: true,
      },
      pool: {
        max: 50,
        min: 10,
        acquireTimeoutMillis: 15000,
        testOnBorrow: true,
        testWhileIdle: true,
      },
      monitoring: {
        enableConnectionMonitoring: true,
        enableSlowLogMonitoring: true,
        enableMemoryMonitoring: true,
        memoryCheckInterval: 30000,
      },
    },

    highPerformance: {
      type: 'cluster',
      performance: {
        keepAlive: true,
        keepAliveDelay: 60000,
        noDelay: true,
        connectTimeout: 2000,
        commandTimeout: 1000,
        enableAutoPipelining: true,
        maxAutoPipelineCommands: 200,
        compression: {
          enabled: true,
          algorithm: 'gzip',
          threshold: 1024,
        },
      },
      retry: {
        retries: 2,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 50,
        maxRetriesPerRequest: 2,
      },
      pool: {
        max: 100,
        min: 20,
        acquireTimeoutMillis: 5000,
        idleTimeoutMillis: 60000,
        testOnBorrow: false,
        testWhileIdle: false,
      },
      monitoring: {
        enableConnectionMonitoring: true,
        enableCommandMonitoring: false,
        enableSlowLogMonitoring: true,
        slowLogThreshold: 5000,
      },
    },

    memoryOptimized: {
      type: 'standalone',
      performance: {
        maxMemoryPolicy: 'allkeys-lru',
        compression: {
          enabled: true,
          algorithm: 'gzip',
          threshold: 512,
        },
      },
      pool: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 10000,
        evictionRunIntervalMillis: 5000,
      },
      monitoring: {
        enableMemoryMonitoring: true,
        memoryCheckInterval: 10000,
      },
    },
  };
}

/**
 * Create a Redis configuration builder
 */
export function createRedisConfig(): RedisConfigBuilder {
  return new RedisConfigBuilder();
}

/**
 * Quick configuration helpers
 */
export const RedisConfigHelpers = {
  /**
   * Create standalone Redis config
   */
  standalone: (url: string, options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().setStandalone(url).merge(options || {}).build(),

  /**
   * Create cluster Redis config
   */
  cluster: (nodes: RedisClusterConfig['nodes'], options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().setCluster({ nodes }).merge(options || {}).build(),

  /**
   * Create sentinel Redis config
   */
  sentinel: (
    sentinels: RedisSentinelConfig['sentinels'],
    name: string,
    options?: Partial<AdvancedRedisConfig>
  ) =>
    createRedisConfig().setSentinel({ sentinels, name }).merge(options || {}).build(),

  /**
   * Create development config
   */
  development: (options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().applyPreset('development').merge(options || {}).build(),

  /**
   * Create production config
   */
  production: (options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().applyPreset('production').merge(options || {}).build(),

  /**
   * Create testing config
   */
  testing: (options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().applyPreset('testing').merge(options || {}).build(),

  /**
   * Create high availability config
   */
  highAvailability: (options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().applyPreset('highAvailability').merge(options || {}).build(),

  /**
   * Create high performance config
   */
  highPerformance: (options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().applyPreset('highPerformance').merge(options || {}).build(),

  /**
   * Create memory optimized config
   */
  memoryOptimized: (options?: Partial<AdvancedRedisConfig>) =>
    createRedisConfig().applyPreset('memoryOptimized').merge(options || {}).build(),
};
