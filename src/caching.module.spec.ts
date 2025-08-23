import { Test, TestingModule } from '@nestjs/testing';
import { CachingModule } from './caching.module';
import { RedisService } from './services/redis.service';
import {
  CachingOptions,
  AsyncCachingOptions,
} from './interfaces/caching-options.interface';
import { AdvancedRedisConfig } from './interfaces/redis-config.interface';
import { Module } from '@nestjs/common';

// Mock Redis
jest.mock('ioredis', () => {
  return {
    __esModule: true,
    Redis: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

describe('CachingModule', () => {
  describe('forRoot', () => {
    it('should create module with synchronous configuration', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
        defaultTtl: 300,
        logger: true,
      };

      const module = CachingModule.forRoot(options);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toContain(RedisService);
      expect(module.global).toBe(true);

      // Check that providers are correctly configured
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const optionsProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'CACHING_OPTIONS',
      );

      expect(redisProvider).toBeDefined();
      expect(optionsProvider).toBeDefined();
    });

    it('should create module with minimal configuration', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
      };

      const module = CachingModule.forRoot(options);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toContain(RedisService);
      expect(module.global).toBe(true);
    });

    it('should handle options with undefined values', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
        keyPrefix: undefined,
        defaultTtl: undefined,
        logger: undefined,
      };

      const module = CachingModule.forRoot(options);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
    });

    it('should create module with default options', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
      });

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });

    it('should create module with custom keyPrefix', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
      });

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });

    // New validation tests
    describe('validation', () => {
      it('should throw error when options are null', () => {
        expect(() => {
          CachingModule.forRoot(null as any);
        }).toThrow('CachingOptions are required');
      });

      it('should throw error when options are undefined', () => {
        expect(() => {
          CachingModule.forRoot(undefined as any);
        }).toThrow('CachingOptions are required');
      });

      it('should throw error when redisUrl is missing', () => {
        expect(() => {
          CachingModule.forRoot({} as any);
        }).toThrow('redisUrl cannot be empty');
      });

      it('should throw error when redisUrl is not a string', () => {
        expect(() => {
          CachingModule.forRoot({ redisUrl: 123 } as any);
        }).toThrow('redisUrl must be a string');
      });

      it('should throw error when redisUrl is empty string', () => {
        expect(() => {
          CachingModule.forRoot({ redisUrl: '' });
        }).toThrow('redisUrl cannot be empty');
      });

      it('should throw error when redisUrl is only whitespace', () => {
        expect(() => {
          CachingModule.forRoot({ redisUrl: '   ' });
        }).toThrow('redisUrl cannot be empty');
      });

      it('should throw error when keyPrefix is not a string', () => {
        expect(() => {
          CachingModule.forRoot({
            redisUrl: 'redis://localhost:6379',
            keyPrefix: 123 as any,
          });
        }).toThrow('keyPrefix must be a string');
      });

      it('should throw error when defaultTtl is not a positive number', () => {
        expect(() => {
          CachingModule.forRoot({
            redisUrl: 'redis://localhost:6379',
            defaultTtl: -1,
          });
        }).toThrow('defaultTtl must be a positive number');
      });

      it('should throw error when defaultTtl is zero', () => {
        expect(() => {
          CachingModule.forRoot({
            redisUrl: 'redis://localhost:6379',
            defaultTtl: 0,
          });
        }).toThrow('defaultTtl must be a positive number');
      });

      it('should throw error when logger is not a boolean', () => {
        expect(() => {
          CachingModule.forRoot({
            redisUrl: 'redis://localhost:6379',
            logger: 'true' as any,
          });
        }).toThrow('logger must be a boolean');
      });
    });
  });

  describe('forRootAsync', () => {
    @Module({})
    class TestModule {}

    it('should create module with async configuration', () => {
      const asyncOptions: AsyncCachingOptions = {
        useFactory: () => ({
          redisUrl: 'redis://localhost:6379',
          keyPrefix: 'async:',
        }),
      };

      const module = CachingModule.forRootAsync(asyncOptions);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(2);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });

    it('should resolve Redis client with default keyPrefix', async () => {
      const asyncOptions: AsyncCachingOptions = {
        useFactory: () => ({ redisUrl: 'redis://localhost:6379' }),
      };

      const module = CachingModule.forRootAsync(asyncOptions);
      const redisProvider = (module.providers as any).find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const RedisMock = require('ioredis').Redis as jest.Mock;
      await redisProvider.useFactory();
      expect(RedisMock).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({ keyPrefix: '' }),
      );
    });

    it('should create module with inject dependencies', () => {
      const asyncOptions: AsyncCachingOptions = {
        useFactory: (configService: any) => ({
          redisUrl: configService.get('REDIS_URL'),
        }),
        inject: ['CONFIG_SERVICE'],
      };

      const module = CachingModule.forRootAsync(asyncOptions);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(2);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });

    it('should create module with imports', () => {
      const asyncOptions: AsyncCachingOptions = {
        useFactory: () => ({
          redisUrl: 'redis://localhost:6379',
        }),
        imports: [TestModule],
      };

      const module = CachingModule.forRootAsync(asyncOptions);

      expect(module.module).toBe(CachingModule);
      expect(module.imports).toEqual([TestModule]);
    });

    // New async validation tests
    describe('validation', () => {
      it('should throw error when options are null', () => {
        expect(() => {
          CachingModule.forRootAsync(null as any);
        }).toThrow('AsyncCachingOptions are required');
      });

      it('should throw error when options are undefined', () => {
        expect(() => {
          CachingModule.forRootAsync(undefined as any);
        }).toThrow('AsyncCachingOptions are required');
      });

      it('should throw error when useFactory is missing', () => {
        expect(() => {
          CachingModule.forRootAsync({} as any);
        }).toThrow('useFactory is required in AsyncCachingOptions');
      });

      it('should throw error when useFactory is not a function', () => {
        expect(() => {
          CachingModule.forRootAsync({ useFactory: 'not-a-function' } as any);
        }).toThrow('useFactory must be a function');
      });

      it('should throw error when inject is not an array', () => {
        expect(() => {
          CachingModule.forRootAsync({
            useFactory: () => ({ redisUrl: 'redis://localhost:6379' }),
            inject: 'not-an-array' as any,
          });
        }).toThrow('inject must be an array');
      });

      it('should throw error when imports is not an array', () => {
        expect(() => {
          CachingModule.forRootAsync({
            useFactory: () => ({ redisUrl: 'redis://localhost:6379' }),
            imports: 'not-an-array' as any,
          });
        }).toThrow('imports must be an array');
      });
    });
  });

  describe('integration', () => {
    it('should create a working module that can be tested', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          CachingModule.forRoot({
            redisUrl: 'redis://localhost:6379',
            keyPrefix: 'test:',
          }),
        ],
      }).compile();

      const redisService = module.get<RedisService>(RedisService);
      expect(redisService).toBeDefined();
    });

    it('should create a working async module that can be tested', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          CachingModule.forRootAsync({
            useFactory: () => ({
              redisUrl: 'redis://localhost:6379',
              keyPrefix: 'async-test:',
            }),
          }),
        ],
      }).compile();

      const redisService = module.get<RedisService>(RedisService);
      expect(redisService).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle Redis connection errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock Redis constructor to throw an error
      const OriginalRedis = require('ioredis').Redis;
      require('ioredis').Redis = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });

      expect(() => {
        const module = CachingModule.forRoot({
          redisUrl: 'redis://invalid:6379',
        });
        
        // Try to execute the factory function
        const redisProvider = (module.providers as any)?.find(
          (p: any) => p.provide === 'REDIS_CLIENT',
        );
        redisProvider.useFactory();
      }).toThrow('Failed to create Redis client: Connection failed');

      // Restore original Redis mock
      require('ioredis').Redis = OriginalRedis;
      consoleSpy.mockRestore();
    });

    it('should validate resolved config in async mode', async () => {
      const asyncOptions: AsyncCachingOptions = {
        useFactory: () => Promise.resolve({
          redisUrl: '', // Invalid empty URL
        }),
      };

      const module = CachingModule.forRootAsync(asyncOptions);
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );

      await expect(redisProvider.useFactory()).rejects.toThrow(
        'Failed to create Redis client: redisUrl cannot be empty',
      );
    });
  });

  describe('Advanced Redis Configuration', () => {
    describe('forRoot with advanced config', () => {
      it('should create module with standalone Redis config', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'redis-server',
          port: 6380,
          keyPrefix: 'app:',
          defaultTtl: 600,
          enableLogging: true,
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
        expect(module.exports).toContain(RedisService);
        expect(module.global).toBe(true);
      });

      it('should create module with cluster Redis config', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'cluster',
          cluster: {
            nodes: [
              { host: 'redis-1', port: 6379 },
              { host: 'redis-2', port: 6379 },
            ],
            options: {
              enableReadyCheck: true,
              maxRedirections: 16,
            },
          },
          keyPrefix: 'cluster:',
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should create module with sentinel Redis config', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: {
            sentinels: [
              { host: 'sentinel-1', port: 26379 },
              { host: 'sentinel-2', port: 26379 },
            ],
            name: 'mymaster',
          },
          keyPrefix: 'sentinel:',
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should apply backward compatibility overrides', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'redis-server',
          port: 6379,
        };

        const options: CachingOptions = {
          redis: advancedConfig,
          keyPrefix: 'override:',
          defaultTtl: 1200,
          logger: false,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should validate advanced Redis config', () => {
        const invalidConfig: AdvancedRedisConfig = {
          type: 'cluster',
          // Missing cluster configuration
        };

        const options: CachingOptions = {
          redis: invalidConfig,
        };

        expect(() => {
          CachingModule.forRoot(options);
        }).toThrow('Invalid Redis configuration');
      });

      it('should handle TLS configuration', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'secure-redis',
          port: 6380,
          tls: {
            enabled: true,
            rejectUnauthorized: true,
            servername: 'redis.example.com',
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle security configuration', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'auth-redis',
          port: 6379,
          security: {
            username: 'redis-user',
            password: 'redis-pass',
            db: 2,
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle performance configuration', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'fast-redis',
          port: 6379,
          performance: {
            connectTimeout: 5000,
            commandTimeout: 3000,
            enableAutoPipelining: true,
            keepAlive: true,
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle retry configuration', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'retry-redis',
          port: 6379,
          retry: {
            retries: 5,
            retryDelayOnFailover: 1000,
            maxRetriesPerRequest: 3,
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle pool configuration', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'pool-redis',
          port: 6379,
          pool: {
            min: 2,
            max: 10,
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle monitoring configuration', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'monitor-redis',
          port: 6379,
          monitoring: {
            enableMetrics: true,
            metricsPrefix: 'redis_stats',
            slowLogEnabled: true,
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle environment-specific overrides', () => {
        const advancedConfig: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'default-redis',
          port: 6379,
          environment: {
            test: {
              host: 'test-redis',
              port: 6380,
            },
            production: {
              host: 'prod-redis',
              port: 6381,
              tls: { enabled: true },
            },
          },
        };

        const options: CachingOptions = {
          redis: advancedConfig,
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });
    });

    describe('forRootAsync with advanced config', () => {
      it('should create module with async advanced config', () => {
        const asyncOptions: AsyncCachingOptions = {
          useFactory: () => {
            const advancedConfig: AdvancedRedisConfig = {
              type: 'standalone',
              host: 'async-redis',
              port: 6379,
              keyPrefix: 'async:',
              defaultTtl: 900,
            };

            return {
              redis: advancedConfig,
            };
          },
        };

        const module = CachingModule.forRootAsync(asyncOptions);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(2);
        expect(module.exports).toEqual([RedisService]);
        expect(module.global).toBe(true);
      });

      it('should validate async advanced config', async () => {
        const asyncOptions: AsyncCachingOptions = {
          useFactory: () => Promise.resolve({
            redis: {
              type: 'cluster',
              // Invalid: missing cluster nodes
            } as AdvancedRedisConfig,
          }),
        };

        const module = CachingModule.forRootAsync(asyncOptions);
        const redisProvider = (module.providers as any)?.find(
          (p: any) => p.provide === 'REDIS_CLIENT',
        );

        await expect(redisProvider.useFactory()).rejects.toThrow(
          'Failed to create Redis client: Invalid Redis configuration'
        );
      });

      it('should handle async cluster configuration', () => {
        const asyncOptions: AsyncCachingOptions = {
          useFactory: () => ({
            redis: {
              type: 'cluster',
              cluster: {
                nodes: [
                  { host: 'async-redis-1', port: 6379 },
                  { host: 'async-redis-2', port: 6379 },
                ],
              },
            } as AdvancedRedisConfig,
          }),
        };

        const module = CachingModule.forRootAsync(asyncOptions);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(2);
      });

      it('should handle async sentinel configuration', () => {
        const asyncOptions: AsyncCachingOptions = {
          useFactory: () => ({
            redis: {
              type: 'sentinel',
              sentinel: {
                sentinels: [
                  { host: 'async-sentinel-1', port: 26379 },
                ],
                name: 'async-master',
              },
            } as AdvancedRedisConfig,
          }),
        };

        const module = CachingModule.forRootAsync(asyncOptions);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(2);
      });
    });

    describe('legacy compatibility', () => {
      it('should convert legacy options to advanced config', () => {
        const legacyOptions: CachingOptions = {
          redisUrl: 'redis://legacy:6379',
          keyPrefix: 'legacy:',
          defaultTtl: 500,
          logger: true,
        };

        const module = CachingModule.forRoot(legacyOptions);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should handle legacy options without optional fields', () => {
        const legacyOptions: CachingOptions = {
          redisUrl: 'redis://minimal:6379',
        };

        const module = CachingModule.forRoot(legacyOptions);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should prioritize advanced config over legacy options', () => {
        const options: CachingOptions = {
          // Legacy options (should be ignored)
          redisUrl: 'redis://legacy:6379',
          keyPrefix: 'legacy:',
          
          // Advanced config (should take precedence)
          redis: {
            type: 'standalone',
            host: 'advanced-redis',
            port: 6380,
            keyPrefix: 'advanced:',
          },
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });

      it('should apply legacy overrides to advanced config', () => {
        const options: CachingOptions = {
          keyPrefix: 'override:',
          defaultTtl: 1500,
          logger: false,
          redis: {
            type: 'standalone',
            host: 'base-redis',
            port: 6379,
          },
        };

        const module = CachingModule.forRoot(options);

        expect(module.module).toBe(CachingModule);
        expect(module.providers).toHaveLength(3);
      });
    });
  });

  describe('maskRedisUrl private method', () => {
    it('should mask password in Redis URL', () => {
      // Access the private method for testing
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://user:password@localhost:6379/0');
      expect(maskedUrl).toBe('redis://user:****@localhost:6379/0');
    });

    it('should handle URL without password', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://localhost:6379');
      expect(maskedUrl).toBe('redis://localhost:6379');
    });

    it('should handle malformed URLs', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('invalid-url');
      expect(maskedUrl).toBe('****');
    });

    it('should handle URLs with protocol but malformed structure', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://malformed');
      expect(maskedUrl).toBe('redis://****');
    });

    it('should handle malformed URLs with protocol - IPv6 case', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      // This should definitely trigger URL parsing failure but have a protocol match
      const maskedUrl = maskRedisUrl('http://[invalid-ipv6');
      expect(maskedUrl).toBe('http://****');
    });

    it('should handle malformed URLs with protocol regex but no match', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      // This should trigger the return '****' case for no protocol match
      const maskedUrl = maskRedisUrl('completely-invalid-url-with-no-protocol');
      expect(maskedUrl).toBe('****');
    });

    it('should handle localhost hostname', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://user:pass@localhost:6379/0');
      expect(maskedUrl).toBe('redis://user:****@localhost:6379/0');
    });

    it('should handle IPv4 hostname', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://user:pass@192.168.1.100:6379/0');
      expect(maskedUrl).toBe('redis://user:****@192.168.1.100:6379/0');
    });

    it('should handle hostname with dots', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://user:pass@redis.example.com:6379/0');
      expect(maskedUrl).toBe('redis://user:****@redis.example.com:6379/0');
    });

    it('should handle IPv6 hostname', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://user:pass@[::1]:6379/0');
      expect(maskedUrl).toBe('redis://user:****@[::1]:6379/0');
    });

    it('should mask simple hostname without dots', () => {
      const maskRedisUrl = (CachingModule as any).maskRedisUrl;
      
      const maskedUrl = maskRedisUrl('redis://user:pass@redishost:6379/0');
      expect(maskedUrl).toBe('redis://****');
    });
  });
});
