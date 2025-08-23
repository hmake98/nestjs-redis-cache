import { RedisConfigBuilder, createRedisConfig, RedisConfigHelpers, getRedisConfigPresets } from './redis-config.builder';
import { AdvancedRedisConfig } from '../interfaces/redis-config.interface';

describe('RedisConfigBuilder', () => {
  let builder: RedisConfigBuilder;

  beforeEach(() => {
    builder = new RedisConfigBuilder();
  });

  describe('constructor', () => {
    it('should create a new builder with empty config', () => {
      const config = builder.build();
      expect(config).toEqual({});
    });
  });

  describe('setConnectionType', () => {
    it('should set standalone connection type', () => {
      const config = builder.setConnectionType('standalone').build();
      expect(config.type).toBe('standalone');
    });

    it('should set cluster connection type', () => {
      const config = builder.setConnectionType('cluster').build();
      expect(config.type).toBe('cluster');
    });

    it('should set sentinel connection type', () => {
      const config = builder.setConnectionType('sentinel').build();
      expect(config.type).toBe('sentinel');
    });
  });

  describe('setStandalone', () => {
    it('should set standalone with URL string', () => {
      const config = builder.setStandalone('redis://localhost:6379').build();
      expect(config.type).toBe('standalone');
      expect(config.url).toBe('redis://localhost:6379');
    });

    it('should set standalone with host and port object', () => {
      const config = builder.setStandalone({ host: 'redis-server', port: 6380 }).build();
      expect(config.type).toBe('standalone');
      expect(config.host).toBe('redis-server');
      expect(config.port).toBe(6380);
    });

    it('should set standalone with host only (default port)', () => {
      const config = builder.setStandalone({ host: 'redis-server' }).build();
      expect(config.type).toBe('standalone');
      expect(config.host).toBe('redis-server');
      expect(config.port).toBe(6379);
    });
  });

  describe('setCluster', () => {
    it('should set cluster configuration', () => {
      const clusterConfig = {
        nodes: [
          { host: 'redis-1', port: 6379 },
          { host: 'redis-2', port: 6379 },
        ],
      };
      const config = builder.setCluster(clusterConfig).build();
      expect(config.type).toBe('cluster');
      expect(config.cluster).toEqual(clusterConfig);
    });
  });

  describe('setSentinel', () => {
    it('should set sentinel configuration', () => {
      const sentinelConfig = {
        sentinels: [
          { host: 'sentinel-1', port: 26379 },
          { host: 'sentinel-2', port: 26379 },
        ],
        name: 'mymaster',
      };
      const config = builder.setSentinel(sentinelConfig).build();
      expect(config.type).toBe('sentinel');
      expect(config.sentinel).toEqual(sentinelConfig);
    });
  });

  describe('setKeyPrefix', () => {
    it('should set key prefix', () => {
      const config = builder.setKeyPrefix('myapp:').build();
      expect(config.keyPrefix).toBe('myapp:');
    });
  });

  describe('setDefaultTtl', () => {
    it('should set default TTL', () => {
      const config = builder.setDefaultTtl(3600).build();
      expect(config.defaultTtl).toBe(3600);
    });
  });

  describe('setLogging', () => {
    it('should enable logging', () => {
      const config = builder.setLogging(true).build();
      expect(config.enableLogging).toBe(true);
    });

    it('should disable logging', () => {
      const config = builder.setLogging(false).build();
      expect(config.enableLogging).toBe(false);
    });
  });

  describe('setSecurity', () => {
    it('should set security configuration', () => {
      const securityConfig = {
        password: 'secret',
        username: 'user',
        db: 1,
      };
      const config = builder.setSecurity(securityConfig).build();
      expect(config.security).toEqual(securityConfig);
    });
  });

  describe('setTLS', () => {
    it('should set TLS configuration', () => {
      const tlsConfig = {
        enabled: true,
        ca: '/path/to/ca.pem',
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
      };
      const config = builder.setTLS(tlsConfig).build();
      expect(config.tls).toEqual(tlsConfig);
    });
  });

  describe('setPool', () => {
    it('should set pool configuration', () => {
      const poolConfig = {
        max: 20,
        min: 5,
        acquireTimeoutMillis: 30000,
      };
      const config = builder.setPool(poolConfig).build();
      expect(config.pool).toEqual(poolConfig);
    });
  });

  describe('setRetry', () => {
    it('should set retry configuration', () => {
      const retryConfig = {
        retries: 3,
        retryDelayOnFailover: 1000,
        enableRetryOnTimeout: true,
      };
      const config = builder.setRetry(retryConfig).build();
      expect(config.retry).toEqual(retryConfig);
    });
  });

  describe('setPerformance', () => {
    it('should set performance configuration', () => {
      const performanceConfig = {
        enableAutoPipelining: true,
        maxAutoPipelineCommands: 100,
        keepAlive: true,
      };
      const config = builder.setPerformance(performanceConfig).build();
      expect(config.performance).toEqual(performanceConfig);
    });
  });

  describe('setMonitoring', () => {
    it('should set monitoring configuration', () => {
      const monitoringConfig = {
        enableConnectionMonitoring: true,
        enableSlowLogMonitoring: true,
        slowLogThreshold: 10000,
      };
      const config = builder.setMonitoring(monitoringConfig).build();
      expect(config.monitoring).toEqual(monitoringConfig);
    });
  });

  describe('setCustomOptions', () => {
    it('should set custom Redis options', () => {
      const customOptions = {
        connectTimeout: 5000,
        commandTimeout: 3000,
      };
      const config = builder.setCustomOptions(customOptions).build();
      expect(config.customOptions).toEqual(customOptions);
    });
  });

  describe('addEnvironmentConfig', () => {
    it('should add environment-specific configuration', () => {
      const prodConfig = {
        performance: { enableAutoPipelining: true },
        pool: { max: 50 },
      };
      const config = builder.addEnvironmentConfig('production', prodConfig).build();
      expect(config.environment?.production).toEqual(prodConfig);
    });

    it('should add multiple environment configurations', () => {
      const prodConfig = { pool: { max: 50 } };
      const devConfig = { monitoring: { enableCommandMonitoring: true } };
      
      const config = builder
        .addEnvironmentConfig('production', prodConfig)
        .addEnvironmentConfig('development', devConfig)
        .build();
      
      expect(config.environment?.production).toEqual(prodConfig);
      expect(config.environment?.development).toEqual(devConfig);
    });
  });

  describe('applyPreset', () => {
    it('should apply development preset', () => {
      const config = builder.applyPreset('development').build();
      expect(config.type).toBe('standalone');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(6379);
      expect(config.enableLogging).toBe(true);
    });

    it('should apply production preset', () => {
      const config = builder.applyPreset('production').build();
      expect(config.type).toBe('standalone');
      expect(config.enableLogging).toBe(true);
      expect(config.performance?.enableAutoPipelining).toBe(true);
      expect(config.pool?.max).toBe(20);
    });

    it('should apply testing preset', () => {
      const config = builder.applyPreset('testing').build();
      expect(config.type).toBe('standalone');
      expect(config.enableLogging).toBe(false);
      expect(config.retry?.retries).toBe(0);
    });

    it('should apply highAvailability preset', () => {
      const config = builder.applyPreset('highAvailability').build();
      expect(config.type).toBe('sentinel');
      expect(config.performance?.enableReadyCheck).toBe(true);
      expect(config.retry?.retries).toBe(5);
    });

    it('should apply highPerformance preset', () => {
      const config = builder.applyPreset('highPerformance').build();
      expect(config.type).toBe('cluster');
      expect(config.performance?.enableAutoPipelining).toBe(true);
      expect(config.performance?.compression?.enabled).toBe(true);
    });

    it('should apply memoryOptimized preset', () => {
      const config = builder.applyPreset('memoryOptimized').build();
      expect(config.type).toBe('standalone');
      expect(config.performance?.maxMemoryPolicy).toBe('allkeys-lru');
      expect(config.performance?.compression?.enabled).toBe(true);
    });

    it('should handle unknown preset gracefully', () => {
      const config = builder.applyPreset('unknown' as any).build();
      expect(config).toEqual({});
    });
  });

  describe('merge', () => {
    it('should merge another configuration', () => {
      const otherConfig: Partial<AdvancedRedisConfig> = {
        keyPrefix: 'merged:',
        security: { password: 'secret' },
      };
      
      const config = builder
        .setStandalone('redis://localhost:6379')
        .merge(otherConfig)
        .build();
      
      expect(config.url).toBe('redis://localhost:6379');
      expect(config.keyPrefix).toBe('merged:');
      expect(config.security).toEqual({ password: 'secret' });
    });

    it('should deep merge nested objects', () => {
      // prepare initial state (intentionally unused variable for clarity)
      builder
        .setPerformance({ enableAutoPipelining: true, keepAlive: false })
        .build();
      
      const mergeConfig: Partial<AdvancedRedisConfig> = {
        performance: { maxAutoPipelineCommands: 200 },
      };
      
      const config = builder
        .setPerformance({ enableAutoPipelining: true, keepAlive: false })
        .merge(mergeConfig)
        .build();
      
      expect(config.performance?.enableAutoPipelining).toBe(true);
      expect(config.performance?.keepAlive).toBe(false);
      expect(config.performance?.maxAutoPipelineCommands).toBe(200);
    });
  });

  describe('reset', () => {
    it('should reset the builder to empty state', () => {
      const config1 = builder
        .setStandalone('redis://localhost:6379')
        .setKeyPrefix('test:')
        .build();
      
      expect(config1.url).toBe('redis://localhost:6379');
      expect(config1.keyPrefix).toBe('test:');
      
      const config2 = builder.reset().build();
      expect(config2).toEqual({});
    });

    it('should allow chaining after reset', () => {
      const config = builder
        .setStandalone('redis://old:6379')
        .reset()
        .setStandalone('redis://new:6379')
        .build();
      
      expect(config.url).toBe('redis://new:6379');
    });
  });

  describe('build', () => {
    it('should return a deep copy of the configuration', () => {
      const config1 = builder.setKeyPrefix('test:').build();
      const config2 = builder.setKeyPrefix('modified:').build();
      
      expect(config1.keyPrefix).toBe('test:');
      expect(config2.keyPrefix).toBe('modified:');
    });
  });

  describe('fluent API chaining', () => {
    it('should allow chaining all configuration methods', () => {
      const config = builder
        .setConnectionType('standalone')
        .setStandalone('redis://localhost:6379')
        .setKeyPrefix('app:')
        .setDefaultTtl(3600)
        .setLogging(true)
        .setSecurity({ password: 'secret' })
        .setPerformance({ enableAutoPipelining: true })
        .setRetry({ retries: 3 })
        .setPool({ max: 10 })
        .setMonitoring({ enableSlowLogMonitoring: true })
        .build();
      
      expect(config.type).toBe('standalone');
      expect(config.url).toBe('redis://localhost:6379');
      expect(config.keyPrefix).toBe('app:');
      expect(config.defaultTtl).toBe(3600);
      expect(config.enableLogging).toBe(true);
      expect(config.security?.password).toBe('secret');
      expect(config.performance?.enableAutoPipelining).toBe(true);
      expect(config.retry?.retries).toBe(3);
      expect(config.pool?.max).toBe(10);
      expect(config.monitoring?.enableSlowLogMonitoring).toBe(true);
    });
  });
});

describe('createRedisConfig', () => {
  it('should create a new RedisConfigBuilder instance', () => {
    const builder = createRedisConfig();
    expect(builder).toBeInstanceOf(RedisConfigBuilder);
  });
});

describe('getRedisConfigPresets', () => {
  let presets: any;

  beforeEach(() => {
    presets = getRedisConfigPresets();
  });

  it('should return all preset configurations', () => {
    expect(presets).toHaveProperty('development');
    expect(presets).toHaveProperty('testing');
    expect(presets).toHaveProperty('production');
    expect(presets).toHaveProperty('highAvailability');
    expect(presets).toHaveProperty('highPerformance');
    expect(presets).toHaveProperty('memoryOptimized');
  });

  it('should have valid development preset', () => {
    const dev = presets.development;
    expect(dev.type).toBe('standalone');
    expect(dev.host).toBe('localhost');
    expect(dev.port).toBe(6379);
    expect(dev.enableLogging).toBe(true);
  });

  it('should have valid testing preset', () => {
    const test = presets.testing;
    expect(test.type).toBe('standalone');
    expect(test.enableLogging).toBe(false);
    expect(test.retry?.retries).toBe(0);
  });

  it('should have valid production preset', () => {
    const prod = presets.production;
    expect(prod.type).toBe('standalone');
    expect(prod.enableLogging).toBe(true);
    expect(prod.performance?.enableAutoPipelining).toBe(true);
    expect(prod.pool?.max).toBe(20);
  });

  it('should have valid highAvailability preset', () => {
    const ha = presets.highAvailability;
    expect(ha.type).toBe('sentinel');
    expect(ha.retry?.retries).toBe(5);
    expect(ha.pool?.max).toBe(50);
  });

  it('should have valid highPerformance preset', () => {
    const hp = presets.highPerformance;
    expect(hp.type).toBe('cluster');
    expect(hp.performance?.enableAutoPipelining).toBe(true);
    expect(hp.performance?.compression?.enabled).toBe(true);
    expect(hp.pool?.max).toBe(100);
  });

  it('should have valid memoryOptimized preset', () => {
    const mo = presets.memoryOptimized;
    expect(mo.type).toBe('standalone');
    expect(mo.performance?.maxMemoryPolicy).toBe('allkeys-lru');
    expect(mo.performance?.compression?.enabled).toBe(true);
  });
});

describe('RedisConfigHelpers', () => {
  describe('standalone', () => {
    it('should create standalone configuration', () => {
      const config = RedisConfigHelpers.standalone('redis://localhost:6379');
      expect(config.type).toBe('standalone');
      expect(config.url).toBe('redis://localhost:6379');
    });

    it('should create standalone configuration with options', () => {
      const config = RedisConfigHelpers.standalone('redis://localhost:6379', {
        keyPrefix: 'test:',
        defaultTtl: 3600,
      });
      expect(config.type).toBe('standalone');
      expect(config.url).toBe('redis://localhost:6379');
      expect(config.keyPrefix).toBe('test:');
      expect(config.defaultTtl).toBe(3600);
    });
  });

  describe('cluster', () => {
    it('should create cluster configuration', () => {
      const nodes = [
        { host: 'redis-1', port: 6379 },
        { host: 'redis-2', port: 6379 },
      ];
      const config = RedisConfigHelpers.cluster(nodes);
      expect(config.type).toBe('cluster');
      expect(config.cluster?.nodes).toEqual(nodes);
    });

    it('should create cluster configuration with options', () => {
      const nodes = [
        { host: 'redis-1', port: 6379 },
        { host: 'redis-2', port: 6379 },
      ];
      const config = RedisConfigHelpers.cluster(nodes, {
        keyPrefix: 'cluster:',
        performance: { enableAutoPipelining: true },
      });
      expect(config.type).toBe('cluster');
      expect(config.cluster?.nodes).toEqual(nodes);
      expect(config.keyPrefix).toBe('cluster:');
      expect(config.performance?.enableAutoPipelining).toBe(true);
    });
  });

  describe('sentinel', () => {
    it('should create sentinel configuration', () => {
      const sentinels = [
        { host: 'sentinel-1', port: 26379 },
        { host: 'sentinel-2', port: 26379 },
      ];
      const config = RedisConfigHelpers.sentinel(sentinels, 'mymaster');
      expect(config.type).toBe('sentinel');
      expect(config.sentinel?.sentinels).toEqual(sentinels);
      expect(config.sentinel?.name).toBe('mymaster');
    });

    it('should create sentinel configuration with options', () => {
      const sentinels = [
        { host: 'sentinel-1', port: 26379 },
        { host: 'sentinel-2', port: 26379 },
      ];
      const config = RedisConfigHelpers.sentinel(sentinels, 'mymaster', {
        keyPrefix: 'sentinel:',
        retry: { retries: 5 },
      });
      expect(config.type).toBe('sentinel');
      expect(config.sentinel?.sentinels).toEqual(sentinels);
      expect(config.sentinel?.name).toBe('mymaster');
      expect(config.keyPrefix).toBe('sentinel:');
      expect(config.retry?.retries).toBe(5);
    });
  });

  describe('development', () => {
    it('should create development configuration', () => {
      const config = RedisConfigHelpers.development();
      expect(config.type).toBe('standalone');
      expect(config.host).toBe('localhost');
      expect(config.enableLogging).toBe(true);
    });

    it('should create development configuration with options', () => {
      const config = RedisConfigHelpers.development({
        keyPrefix: 'dev:',
      });
      expect(config.type).toBe('standalone');
      expect(config.host).toBe('localhost');
      expect(config.enableLogging).toBe(true);
      expect(config.keyPrefix).toBe('dev:');
    });
  });

  describe('production', () => {
    it('should create production configuration', () => {
      const config = RedisConfigHelpers.production();
      expect(config.type).toBe('standalone');
      expect(config.enableLogging).toBe(true);
      expect(config.performance?.enableAutoPipelining).toBe(true);
    });

    it('should create production configuration with options', () => {
      const config = RedisConfigHelpers.production({
        url: 'redis://prod-server:6379',
      });
      expect(config.type).toBe('standalone');
      expect(config.url).toBe('redis://prod-server:6379');
      expect(config.performance?.enableAutoPipelining).toBe(true);
    });
  });

  describe('testing', () => {
    it('should create testing configuration', () => {
      const config = RedisConfigHelpers.testing();
      expect(config.type).toBe('standalone');
      expect(config.enableLogging).toBe(false);
      expect(config.retry?.retries).toBe(0);
    });

    it('should create testing configuration with options', () => {
      const config = RedisConfigHelpers.testing({
        keyPrefix: 'test:',
      });
      expect(config.type).toBe('standalone');
      expect(config.enableLogging).toBe(false);
      expect(config.keyPrefix).toBe('test:');
    });
  });

  describe('highAvailability', () => {
    it('should create high availability configuration', () => {
      const config = RedisConfigHelpers.highAvailability();
      expect(config.type).toBe('sentinel');
      expect(config.retry?.retries).toBe(5);
      expect(config.pool?.max).toBe(50);
    });

    it('should create high availability configuration with options', () => {
      const config = RedisConfigHelpers.highAvailability({
        keyPrefix: 'ha:',
      });
      expect(config.type).toBe('sentinel');
      expect(config.keyPrefix).toBe('ha:');
      expect(config.retry?.retries).toBe(5);
    });
  });

  describe('highPerformance', () => {
    it('should create high performance configuration', () => {
      const config = RedisConfigHelpers.highPerformance();
      expect(config.type).toBe('cluster');
      expect(config.performance?.enableAutoPipelining).toBe(true);
      expect(config.performance?.compression?.enabled).toBe(true);
    });

    it('should create high performance configuration with options', () => {
      const config = RedisConfigHelpers.highPerformance({
        keyPrefix: 'hp:',
      });
      expect(config.type).toBe('cluster');
      expect(config.keyPrefix).toBe('hp:');
      expect(config.performance?.compression?.enabled).toBe(true);
    });
  });

  describe('memoryOptimized', () => {
    it('should create memory optimized configuration', () => {
      const config = RedisConfigHelpers.memoryOptimized();
      expect(config.type).toBe('standalone');
      expect(config.performance?.maxMemoryPolicy).toBe('allkeys-lru');
      expect(config.performance?.compression?.enabled).toBe(true);
    });

    it('should create memory optimized configuration with options', () => {
      const config = RedisConfigHelpers.memoryOptimized({
        keyPrefix: 'mem:',
      });
      expect(config.type).toBe('standalone');
      expect(config.keyPrefix).toBe('mem:');
      expect(config.performance?.maxMemoryPolicy).toBe('allkeys-lru');
    });
  });
});
