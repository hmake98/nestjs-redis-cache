import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  CachingOptions,
  AsyncCachingOptions,
} from './interfaces/caching-options.interface';
import { RedisService } from './services/redis.service';

@Module({})
export class CachingModule {
  /**
   * Synchronous module configuration
   */
  static forRoot(options: CachingOptions): DynamicModule {
    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redis = new Redis(options.redisUrl, {
          keyPrefix: options.keyPrefix || '',
          maxRetriesPerRequest: 3,
        });
        return redis;
      },
    };

    return {
      module: CachingModule,
      providers: [
        redisProvider,
        {
          provide: 'CACHING_OPTIONS',
          useValue: options,
        },
        RedisService,
      ],
      exports: [RedisService],
      global: true,
    };
  }

  /**
   * Asynchronous module configuration
   */
  static forRootAsync(options: AsyncCachingOptions): DynamicModule {
    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);
        const redis = new Redis(config.redisUrl, {
          keyPrefix: config.keyPrefix || '',
          maxRetriesPerRequest: 3,
        });
        return redis;
      },
      inject: options.inject || [],
    };

    return {
      module: CachingModule,
      imports: options.imports || [],
      providers: [
        redisProvider,
        {
          provide: 'CACHING_OPTIONS',
          useFactory: async (...args: any[]) => {
            return await options.useFactory(...args);
          },
          inject: options.inject || [],
        },
        RedisService,
      ],
      exports: [RedisService],
      global: true,
    };
  }
}
