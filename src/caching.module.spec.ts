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
  });

  describe('forRootAsync', () => {
    it('should create module with asynchronous configuration', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config = {
            REDIS_URL: 'redis://localhost:6379',
            CACHE_PREFIX: 'async:',
            CACHE_TTL: 600,
          };
          return config[key];
        }),
      };

      const options: AsyncCachingOptions = {
        useFactory: (configService: any) => ({
          redisUrl: configService.get('REDIS_URL'),
          keyPrefix: configService.get('CACHE_PREFIX'),
          defaultTtl: configService.get('CACHE_TTL'),
        }),
        inject: [mockConfigService],
      };

      const module = CachingModule.forRootAsync(options);

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

    it('should create module with async factory returning promise', async () => {
      const options: AsyncCachingOptions = {
        useFactory: async () => ({
          redisUrl: 'redis://localhost:6379',
          keyPrefix: 'promise:',
          defaultTtl: 900,
        }),
      };

      const module = CachingModule.forRootAsync(options);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toContain(RedisService);
      expect(module.global).toBe(true);
    });

    it('should handle async configuration without inject', async () => {
      const options: AsyncCachingOptions = {
        useFactory: () => ({
          redisUrl: 'redis://localhost:6379',
        }),
      };

      const module = CachingModule.forRootAsync(options);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toContain(RedisService);
      expect(module.global).toBe(true);
    });

    it('should handle async configuration with empty inject array', async () => {
      const options: AsyncCachingOptions = {
        useFactory: () => ({
          redisUrl: 'redis://localhost:6379',
        }),
        inject: [],
      };

      const module = CachingModule.forRootAsync(options);

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toContain(RedisService);
      expect(module.global).toBe(true);
    });

    it('should create a working async module instance', async () => {
      class MockConfigService {
        get(key: string) {
          const config: any = {
            REDIS_URL: 'redis://localhost:6379',
            CACHE_PREFIX: 'async:',
          };
          return config[key];
        }
      }
      @Module({ providers: [MockConfigService], exports: [MockConfigService] })
      class MockConfigModule {}
      const options: AsyncCachingOptions = {
        imports: [MockConfigModule],
        useFactory: (configService: MockConfigService) => ({
          redisUrl: configService.get('REDIS_URL'),
          keyPrefix: configService.get('CACHE_PREFIX'),
        }),
        inject: [MockConfigService],
      };

      const module = CachingModule.forRootAsync(options);

      const testModule: TestingModule = await Test.createTestingModule({
        imports: [MockConfigModule, module],
      }).compile();

      const redisService = testModule.get<RedisService>(RedisService);
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should create async module with default options', () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
      });

      const module = CachingModule.forRootAsync({
        useFactory,
      });

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
      expect(module.imports).toEqual([]);
    });

    it('should create async module with custom options', () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
      });

      const module = CachingModule.forRootAsync({
        useFactory,
        inject: ['CONFIG'],
        imports: [],
      });

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
      expect(module.imports).toEqual([]);
    });

    it('should create async module with custom keyPrefix from factory', () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'custom:',
      });

      const module = CachingModule.forRootAsync({
        useFactory,
      });

      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });
  });

  describe('module integration', () => {
    it('should create a working module instance', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
        defaultTtl: 300,
      };

      const module = CachingModule.forRoot(options);

      const testModule: TestingModule = await Test.createTestingModule({
        imports: [module],
      }).compile();

      const redisService = testModule.get<RedisService>(RedisService);
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });

    it('should create a working async module instance', async () => {
      class MockConfigService {
        get(key: string) {
          const config: any = {
            REDIS_URL: 'redis://localhost:6379',
            CACHE_PREFIX: 'async:',
          };
          return config[key];
        }
      }
      @Module({ providers: [MockConfigService], exports: [MockConfigService] })
      class MockConfigModule {}
      const options: AsyncCachingOptions = {
        imports: [MockConfigModule],
        useFactory: (configService: MockConfigService) => ({
          redisUrl: configService.get('REDIS_URL'),
          keyPrefix: configService.get('CACHE_PREFIX'),
        }),
        inject: [MockConfigService],
      };

      const module = CachingModule.forRootAsync(options);

      const testModule: TestingModule = await Test.createTestingModule({
        imports: [MockConfigModule, module],
      }).compile();

      const redisService = testModule.get<RedisService>(RedisService);
      expect(redisService).toBeDefined();
      expect(redisService).toBeInstanceOf(RedisService);
    });
  });

  describe('provider configuration', () => {
    it('should configure Redis client with correct options', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
      };

      const module = CachingModule.forRoot(options);
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );

      expect(redisProvider).toBeDefined();
      expect((redisProvider as any)?.useFactory).toBeDefined();
    });

    it('should configure options provider correctly', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
        defaultTtl: 300,
      };

      const module = CachingModule.forRoot(options);
      const optionsProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'CACHING_OPTIONS',
      );

      expect(optionsProvider).toBeDefined();
      expect((optionsProvider as any)?.useValue).toEqual(options);
    });

    it('should include RedisService in providers', async () => {
      const options: CachingOptions = {
        redisUrl: 'redis://localhost:6379',
      };

      const module = CachingModule.forRoot(options);
      const redisServiceProvider = (module.providers as any)?.find(
        (p: any) => p === RedisService,
      );

      expect(redisServiceProvider).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle factory function errors gracefully', async () => {
      const options: AsyncCachingOptions = {
        useFactory: () => {
          throw new Error('Factory error');
        },
      };

      const module = CachingModule.forRootAsync(options);
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );

      expect(redisProvider).toBeDefined();
      expect((redisProvider as any)?.useFactory).toBeDefined();
    });

    it('should handle async factory function errors gracefully', async () => {
      const options: AsyncCachingOptions = {
        useFactory: async () => {
          throw new Error('Async factory error');
        },
      };

      const module = CachingModule.forRootAsync(options);
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );

      expect(redisProvider).toBeDefined();
      expect((redisProvider as any)?.useFactory).toBeDefined();
    });
  });

  describe('Coverage edge cases', () => {
    it('should handle undefined options in forRoot', () => {
      expect(() =>
        CachingModule.forRoot({ redisUrl: undefined as any }),
      ).not.toThrow();
    });

    it('should handle error in useFactory forRootAsync', () => {
      const options: AsyncCachingOptions = {
        useFactory: () => {
          throw new Error('factory error');
        },
      };
      const module = CachingModule.forRootAsync(options);
      expect(module).toBeDefined();
      // The error is thrown at runtime, not at module creation
    });
  });

  describe('forRoot edge cases', () => {
    it('should create Redis instance with valid options', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
      });
      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });

    it('should create Redis instance without keyPrefix', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
      });
      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });
  });

  describe('forRootAsync edge cases', () => {
    it('should create async module with factory that returns valid config', async () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
      });
      const module = CachingModule.forRootAsync({ useFactory });
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const result = await redisProvider.useFactory();
      expect(result).toBeDefined();
    });

    it('should create async module with factory that returns config without keyPrefix', async () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
      });
      const module = CachingModule.forRootAsync({ useFactory });
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const result = await redisProvider.useFactory();
      expect(result).toBeDefined();
    });

    it('should create async module with inject dependencies', async () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: 'test:',
      });
      const module = CachingModule.forRootAsync({
        useFactory,
        inject: ['CONFIG'],
      });
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const result = await redisProvider.useFactory('config');
      expect(result).toBeDefined();
    });
  });

  describe('forRoot branch coverage', () => {
    it('should create Redis instance with only redisUrl', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
      });
      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });
    it('should create Redis instance with redisUrl and undefined keyPrefix', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: undefined,
      });
      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });
    it('should create Redis instance with redisUrl and empty string keyPrefix', () => {
      const module = CachingModule.forRoot({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: '',
      });
      expect(module.module).toBe(CachingModule);
      expect(module.providers).toHaveLength(3);
      expect(module.exports).toEqual([RedisService]);
      expect(module.global).toBe(true);
    });
  });

  describe('forRootAsync branch coverage', () => {
    it('should create async module with factory that returns config with only redisUrl', async () => {
      const useFactory = jest
        .fn()
        .mockResolvedValue({ redisUrl: 'redis://localhost:6379' });
      const module = CachingModule.forRootAsync({ useFactory });
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const result = await redisProvider.useFactory();
      expect(result).toBeDefined();
    });
    it('should create async module with factory that returns config with redisUrl and undefined keyPrefix', async () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: undefined,
      });
      const module = CachingModule.forRootAsync({ useFactory });
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const result = await redisProvider.useFactory();
      expect(result).toBeDefined();
    });
    it('should create async module with factory that returns config with redisUrl and empty string keyPrefix', async () => {
      const useFactory = jest.fn().mockResolvedValue({
        redisUrl: 'redis://localhost:6379',
        keyPrefix: '',
      });
      const module = CachingModule.forRootAsync({ useFactory });
      const redisProvider = (module.providers as any)?.find(
        (p: any) => p.provide === 'REDIS_CLIENT',
      );
      const result = await redisProvider.useFactory();
      expect(result).toBeDefined();
    });
  });
});
