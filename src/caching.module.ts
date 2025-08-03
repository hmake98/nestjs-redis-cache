import { DynamicModule, Module, Provider, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  CachingOptions,
  AsyncCachingOptions,
} from './interfaces/caching-options.interface';
import { RedisService } from './services/redis.service';

@Module({})
export class CachingModule {
  private static readonly logger = new Logger(CachingModule.name);

  /**
   * Synchronous module configuration
   */
  static forRoot(options: CachingOptions): DynamicModule {
    // Validate input options
    this.validateCachingOptions(options);

    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        try {
          const redis = new Redis(options.redisUrl, {
            keyPrefix: options.keyPrefix || '',
            maxRetriesPerRequest: 3,
            lazyConnect: true,
          });
          this.logger.log('Redis client created successfully');
          return redis;
        } catch (error) {
          this.logger.error('Failed to create Redis client', error);
          throw new Error(`Failed to create Redis client: ${error.message}`);
        }
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
    // Validate async options
    this.validateAsyncCachingOptions(options);

    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      useFactory: async (...args: any[]) => {
        try {
          const config = await options.useFactory(...args);
          
          // Validate the resolved config
          this.validateCachingOptions(config);
          
          const redis = new Redis(config.redisUrl, {
            keyPrefix: config.keyPrefix || '',
            maxRetriesPerRequest: 3,
            lazyConnect: true,
          });
          this.logger.log('Redis client created successfully (async)');
          return redis;
        } catch (error) {
          this.logger.error('Failed to create Redis client (async)', error);
          throw new Error(`Failed to create Redis client: ${error.message}`);
        }
      },
      inject: options.inject || [],
    };

    return {
      module: CachingModule,
      providers: [
        redisProvider,
        RedisService,
      ],
      exports: [RedisService],
      global: true,
      imports: options.imports || [],
    };
  }

  /**
   * Validate caching options
   */
  private static validateCachingOptions(options: CachingOptions): void {
    if (!options) {
      throw new Error('CachingOptions are required');
    }

    if (!options.redisUrl || (typeof options.redisUrl === 'string' && options.redisUrl.trim() === '')) {
      throw new Error('redisUrl cannot be empty');
    }

    if (typeof options.redisUrl !== 'string') {
      throw new Error('redisUrl must be a string');
    }

    // Validate optional fields
    if (options.keyPrefix !== undefined && typeof options.keyPrefix !== 'string') {
      throw new Error('keyPrefix must be a string');
    }

    if (options.defaultTtl !== undefined) {
      if (typeof options.defaultTtl !== 'number' || options.defaultTtl <= 0) {
        throw new Error('defaultTtl must be a positive number');
      }
    }

    if (options.logger !== undefined && typeof options.logger !== 'boolean') {
      throw new Error('logger must be a boolean');
    }

    this.logger.log('CachingOptions validation passed');
  }

  /**
   * Validate async caching options
   */
  private static validateAsyncCachingOptions(options: AsyncCachingOptions): void {
    if (!options) {
      throw new Error('AsyncCachingOptions are required');
    }

    if (!options.useFactory) {
      throw new Error('useFactory is required in AsyncCachingOptions');
    }

    if (typeof options.useFactory !== 'function') {
      throw new Error('useFactory must be a function');
    }

    if (options.inject !== undefined && !Array.isArray(options.inject)) {
      throw new Error('inject must be an array');
    }

    if (options.imports !== undefined && !Array.isArray(options.imports)) {
      throw new Error('imports must be an array');
    }

    this.logger.log('AsyncCachingOptions validation passed');
  }
}
