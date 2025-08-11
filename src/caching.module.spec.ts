import { Test, TestingModule } from '@nestjs/testing';
import { CachingModule } from './caching.module';
import { RedisService } from './services/redis.service';
import {
  CachingOptions,
  AsyncCachingOptions,
} from './interfaces/caching-options.interface';
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
});
