import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { CachingModule } from '../caching.module';
import { RedisService } from '../services/redis.service';
import { Cacheable } from '../decorators/cacheable.decorator';
import { AdvancedRedisConfig } from '../interfaces/redis-config.interface';
import { createRedisConfig } from '../utils/redis-config.builder';

// Mock Redis and Cluster
jest.mock('ioredis', () => {
  const mockRedisInstance = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    flushall: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    ttl: jest.fn().mockResolvedValue(-1),
    expire: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hdel: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({}),
    lpush: jest.fn().mockResolvedValue(1),
    rpush: jest.fn().mockResolvedValue(1),
    lpop: jest.fn().mockResolvedValue(null),
    rpop: jest.fn().mockResolvedValue(null),
    lrange: jest.fn().mockResolvedValue([]),
    llen: jest.fn().mockResolvedValue(0),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    status: 'ready',
  };

  return {
    Redis: jest.fn().mockImplementation(() => mockRedisInstance),
    Cluster: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

// Test service with cacheable methods
@Injectable()
class TestService {
  @Cacheable({ key: 'test:user', ttl: 300 })
  async getUser(id: number): Promise<{ id: number; name: string }> {
    return { id, name: `User ${id}` };
  }

  @Cacheable({ key: 'test:posts:{{userId}}', ttl: 600 })
  async getUserPosts(userId: number): Promise<string[]> {
    return [`Post 1 by user ${userId}`, `Post 2 by user ${userId}`];
  }

  @Cacheable({ 
    key: 'test:search:{{query}}:{{page}}', 
    ttl: 900,
    scope: 'global' 
  })
  async searchPosts(query: string, page: number): Promise<any[]> {
    return [
      { id: 1, title: `${query} result 1`, page },
      { id: 2, title: `${query} result 2`, page },
    ];
  }
}

describe('Advanced Redis Configuration Integration Tests', () => {
  let module: TestingModule;
  let redisService: RedisService;
  let testService: TestService;

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('Standalone Configuration', () => {
    beforeEach(async () => {
      const standaloneConfig: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        port: 6379,
        keyPrefix: 'integration:test:',
        defaultTtl: 300,
        enableLogging: false,
        security: {
          db: 0,
        },
        performance: {
          connectTimeout: 10000,
          commandTimeout: 5000,
          enableAutoPipelining: true,
        },
        retry: {
          retries: 3,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 5,
        },
      };

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: standaloneConfig,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should initialize Redis service with standalone configuration', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle basic Redis operations', async () => {
      const key = 'test:basic';
      const value = { data: 'test value' };

      await redisService.set(key, value, 300);
      const retrieved = await redisService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should work with @Cacheable decorator', async () => {
      const userId = 123;
      const result1 = await testService.getUser(userId);
      const result2 = await testService.getUser(userId);

      expect(result1).toEqual({ id: 123, name: 'User 123' });
      expect(result2).toEqual(result1);
    });

    it('should handle parameterized cache keys', async () => {
      const userId = 456;
      const posts1 = await testService.getUserPosts(userId);
      const posts2 = await testService.getUserPosts(userId);

      expect(posts1).toEqual([
        'Post 1 by user 456',
        'Post 2 by user 456'
      ]);
      expect(posts2).toEqual(posts1);
    });

    it('should handle complex parameterized keys', async () => {
      const query = 'javascript';
      const page = 1;
      
      const results1 = await testService.searchPosts(query, page);
      const results2 = await testService.searchPosts(query, page);

      expect(results1).toEqual([
        { id: 1, title: 'javascript result 1', page: 1 },
        { id: 2, title: 'javascript result 2', page: 1 },
      ]);
      expect(results2).toEqual(results1);
    });

    it('should respect TTL settings', async () => {
      const key = 'test:ttl';
      const value = 'test value';
      const ttl = 60;

      await redisService.set(key, value, ttl);
      const retrievedTtl = await redisService.getTtl(key);

      expect(retrievedTtl).toBeGreaterThan(0);
      expect(retrievedTtl).toBeLessThanOrEqual(ttl);
    });

    it('should handle Redis operations with key prefix', async () => {
      const key = 'prefixed:key';
      const value = 'prefixed value';

      await redisService.set(key, value);
      const exists = await redisService.exists(key);

      expect(exists).toBe(true);
    });

    it('should handle connection lifecycle', async () => {
      expect(redisService).toBeDefined();
      
      // Test that the service is functional
      await redisService.set('lifecycle:test', 'working');
      const result = await redisService.get('lifecycle:test');
      
      expect(result).toBe('working');
    });
  });

  describe('Cluster Configuration', () => {
    beforeEach(async () => {
      const clusterConfig: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: {
          nodes: [
            { host: 'redis-node-1', port: 6379 },
            { host: 'redis-node-2', port: 6379 },
            { host: 'redis-node-3', port: 6379 },
          ],
          options: {
            enableReadyCheck: true,
            maxRedirections: 16,
            scaleReads: 'all',
          },
        },
        keyPrefix: 'cluster:test:',
        defaultTtl: 600,
        enableLogging: false,
      };

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: clusterConfig,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should initialize Redis service with cluster configuration', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle cluster Redis operations', async () => {
      const key = 'cluster:test';
      const value = { cluster: true, data: 'test' };

      await redisService.set(key, value, 300);
      const retrieved = await redisService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should work with @Cacheable decorator in cluster mode', async () => {
      const userId = 789;
      const result = await testService.getUser(userId);

      expect(result).toEqual({ id: 789, name: 'User 789' });
    });
  });

  describe('Sentinel Configuration', () => {
    beforeEach(async () => {
      const sentinelConfig: AdvancedRedisConfig = {
        type: 'sentinel',
        sentinel: {
          sentinels: [
            { host: 'sentinel-1', port: 26379 },
            { host: 'sentinel-2', port: 26379 },
          ],
          name: 'mymaster',
          options: {
            sentinelPassword: 'sentinel-pass',
            role: 'master',
          },
        },
        keyPrefix: 'sentinel:test:',
        defaultTtl: 900,
        enableLogging: false,
        security: {
          password: 'redis-pass',
          db: 1,
        },
      };

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: sentinelConfig,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should initialize Redis service with sentinel configuration', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle sentinel Redis operations', async () => {
      const key = 'sentinel:test';
      const value = { sentinel: true, highly_available: true };

      await redisService.set(key, value, 300);
      const retrieved = await redisService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should work with @Cacheable decorator in sentinel mode', async () => {
      const userId = 999;
      const result = await testService.getUser(userId);

      expect(result).toEqual({ id: 999, name: 'User 999' });
    });
  });

  describe('TLS Configuration', () => {
    beforeEach(async () => {
      const tlsConfig: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'secure-redis.example.com',
        port: 6380,
        keyPrefix: 'tls:test:',
        defaultTtl: 1200,
        enableLogging: false,
        tls: {
          enabled: true,
          rejectUnauthorized: true,
          servername: 'secure-redis.example.com',
          minVersion: 'TLSv1.2',
        },
        security: {
          username: 'redis-user',
          password: 'secure-password',
          db: 2,
        },
      };

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: tlsConfig,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should initialize Redis service with TLS configuration', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle secure Redis operations', async () => {
      const key = 'secure:test';
      const value = { secure: true, encrypted: true };

      await redisService.set(key, value, 300);
      const retrieved = await redisService.get(key);

      expect(retrieved).toEqual(value);
    });
  });

  describe('Configuration Builder Integration', () => {
    beforeEach(async () => {
      // Use the configuration builder to create config
      const builtConfig = createRedisConfig()
        .standalone()
        .host('builder-redis')
        .port(6379)
        .keyPrefix('builder:test:')
        .defaultTtl(450)
        .disableLogging()
        .performance({
          connectTimeout: 8000,
          commandTimeout: 4000,
          enableAutoPipelining: true,
          keepAlive: true,
        })
        .security({
          db: 3,
        })
        .build();

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: builtConfig,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should work with configuration built using builder pattern', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle operations with builder-created config', async () => {
      const key = 'builder:test';
      const value = { builtWith: 'RedisConfigBuilder' };

      await redisService.set(key, value, 300);
      const retrieved = await redisService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should work with @Cacheable decorator and builder config', async () => {
      const userId = 1337;
      const result = await testService.getUser(userId);

      expect(result).toEqual({ id: 1337, name: 'User 1337' });
    });
  });

  describe('Async Configuration', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRootAsync({
            useFactory: async () => {
              // Simulate async config resolution
              await new Promise(resolve => setTimeout(resolve, 10));
              
              return {
                redis: {
                  type: 'standalone',
                  host: 'async-redis',
                  port: 6379,
                  keyPrefix: 'async:test:',
                  defaultTtl: 750,
                  enableLogging: false,
                } as AdvancedRedisConfig,
              };
            },
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should initialize Redis service with async configuration', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle operations with async-resolved config', async () => {
      const key = 'async:test';
      const value = { resolvedAsync: true };

      await redisService.set(key, value, 300);
      const retrieved = await redisService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should work with @Cacheable decorator and async config', async () => {
      const userId = 2048;
      const result = await testService.getUser(userId);

      expect(result).toEqual({ id: 2048, name: 'User 2048' });
    });
  });

  describe('Environment Override Integration', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should apply environment-specific overrides', async () => {
      process.env.NODE_ENV = 'test';

      const configWithOverrides: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'default-redis',
        port: 6379,
        keyPrefix: 'default:',
        environment: {
          test: {
            host: 'test-redis',
            port: 6380,
            keyPrefix: 'test:env:',
          },
          production: {
            host: 'prod-redis',
            port: 6381,
            keyPrefix: 'prod:',
          },
        },
      };

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: configWithOverrides,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      
      // The service should be initialized with test environment overrides
      expect(redisService).toBeDefined();
      
      // Test that operations work (the exact configuration is applied internally)
      await redisService.set('env:test', 'environment override working');
      const result = await redisService.get('env:test');
      
      expect(result).toBe('environment override working');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig: AdvancedRedisConfig = {
        type: 'cluster',
        // Missing required cluster nodes
      };

      await expect(
        Test.createTestingModule({
          imports: [
            CachingModule.forRoot({
              redis: invalidConfig,
            }),
          ],
        }).compile()
      ).rejects.toThrow('Invalid Redis configuration');
    });

    it('should handle TLS validation errors', async () => {
      const invalidTlsConfig: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'redis',
        port: 6379,
        tls: {
          enabled: true,
          cert: '/path/to/cert.pem',
          // Missing required key
        },
      };

      await expect(
        Test.createTestingModule({
          imports: [
            CachingModule.forRoot({
              redis: invalidTlsConfig,
            }),
          ],
        }).compile()
      ).rejects.toThrow('Invalid Redis configuration');
    });

    it('should handle pool validation errors', async () => {
      const invalidPoolConfig: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'redis',
        port: 6379,
        pool: {
          min: 10,
          max: 5, // max < min is invalid
        },
      };

      await expect(
        Test.createTestingModule({
          imports: [
            CachingModule.forRoot({
              redis: invalidPoolConfig,
            }),
          ],
        }).compile()
      ).rejects.toThrow('Invalid Redis configuration');
    });
  });

  describe('Performance and Monitoring Integration', () => {
    beforeEach(async () => {
      const performanceConfig: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'perf-redis',
        port: 6379,
        keyPrefix: 'perf:test:',
        defaultTtl: 300,
        enableLogging: true, // Enable logging to test monitoring
        performance: {
          connectTimeout: 5000,
          commandTimeout: 2000,
          enableAutoPipelining: true,
          maxAutoPipelineCommands: 100,
          keepAlive: true,
          keepAliveDelay: 30000,
          noDelay: true,
        },
        monitoring: {
          enableMetrics: true,
          metricsPrefix: 'redis_perf',
          slowLogEnabled: true,
        },
        retry: {
          retries: 5,
          retryDelayOnFailover: 500,
          maxRetriesPerRequest: 10,
        },
      };

      module = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redis: performanceConfig,
          }),
        ],
        providers: [TestService],
      }).compile();

      redisService = module.get<RedisService>(RedisService);
      testService = module.get<TestService>(TestService);
    });

    it('should initialize with performance optimizations', () => {
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should handle high-throughput operations', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          redisService.set(`perf:batch:${i}`, { index: i, data: `Item ${i}` }, 300)
        );
      }

      await Promise.all(operations);

      // Verify all operations completed
      const retrievals = [];
      for (let i = 0; i < 10; i++) {
        retrievals.push(redisService.get(`perf:batch:${i}`));
      }

      const results = await Promise.all(retrievals);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toEqual({ index, data: `Item ${index}` });
      });
    });

    it('should handle cacheable operations under load', async () => {
      const cacheOperations = [];
      
      // Create multiple concurrent cache operations
      for (let i = 0; i < 5; i++) {
        cacheOperations.push(testService.getUser(i));
      }

      const results = await Promise.all(cacheOperations);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toEqual({ id: index, name: `User ${index}` });
      });
    });
  });
});