# NestJS Redis Cache Package

A production-ready, comprehensive Redis caching package for NestJS applications that provides declarative caching with decorators, robust error handling, and seamless integration.

## 🌟 Features

- **🎯 Declarative Caching**: Simple `@Cacheable` decorator for method-level caching
- **⚙️ Flexible Configuration**: Support for both synchronous and asynchronous module setup
- **🔧 Redis Integration**: Built on top of `ioredis` with full Redis feature support
- **🛡️ Production Ready**: Comprehensive error handling with graceful fallbacks
- **📊 Scoped Caching**: Support for global and module-level cache scoping
- **🔒 Type Safe**: Full TypeScript support with comprehensive type definitions
- **🧪 Thoroughly Tested**: 100% test coverage with extensive edge case handling
- **📝 Detailed Logging**: Built-in logging for cache operations and debugging
- **♻️ Graceful Shutdown**: Proper Redis connection cleanup on application shutdown

## 📦 Installation

```bash
npm install nestjs-redis-cache ioredis
```

```bash
yarn add nestjs-redis-cache ioredis
```

## 🚀 Quick Start

### 1. Module Setup

#### Synchronous Configuration

```typescript
import { Module } from '@nestjs/common';
import { CachingModule } from 'nestjs-redis-cache';

@Module({
  imports: [
    CachingModule.forRoot({
      redisUrl: 'redis://localhost:6379',
      keyPrefix: 'myapp:',
      defaultTtl: 300,
      logger: true,
    }),
  ],
})
export class AppModule {}
```

#### Asynchronous Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CachingModule } from 'nestjs-redis-cache';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CachingModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redisUrl: configService.get('REDIS_URL'),
        keyPrefix: configService.get('CACHE_PREFIX'),
        defaultTtl: configService.get('CACHE_TTL'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 2. Using the @Cacheable Decorator

```typescript
import { Injectable } from '@nestjs/common';
import { Cacheable } from 'nestjs-redis-cache';

@Injectable()
export class UserService {
  @Cacheable({
    key: 'user:profile',
    ttl: 600, // 10 minutes
  })
  async getUserProfile(userId: string) {
    // Expensive operation
    return await this.fetchUserFromDatabase(userId);
  }

  @Cacheable({
    key: 'user:settings',
    scope: 'module',
    moduleName: 'UserModule',
    ttl: 1800, // 30 minutes
  })
  async getUserSettings(userId: string) {
    // This will be cached with key: "UserModule:user:settings"
    return await this.fetchUserSettingsFromDatabase(userId);
  }
}
```

### 3. Using RedisService Directly

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis-cache';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  async cacheData(key: string, data: any, ttl?: number) {
    await this.redisService.set(key, data, ttl);
  }

  async getCachedData(key: string) {
    return await this.redisService.get(key);
  }

  async invalidateCache(pattern: string) {
    const keys = await this.redisService.keys(pattern);
    for (const key of keys) {
      await this.redisService.del(key);
    }
  }
}
```

## 📚 API Documentation

### CachingModule

#### `forRoot(options: CachingOptions): DynamicModule`

Configures the caching module synchronously.

**Options:**
- `redisUrl` (required): Redis connection URL
- `keyPrefix` (optional): Global prefix for all cache keys
- `defaultTtl` (optional): Default TTL in seconds for cached items
- `logger` (optional): Enable/disable logging

#### `forRootAsync(options: AsyncCachingOptions): DynamicModule`

Configures the caching module asynchronously.

**Options:**
- `useFactory` (required): Factory function returning `CachingOptions`
- `inject` (optional): Dependencies to inject into the factory
- `imports` (optional): Modules to import for dependency injection

### @Cacheable Decorator

Decorator for method-level caching with automatic cache management.

```typescript
@Cacheable(options: CacheableOptions)
```

**Options:**
- `key` (required): Cache key identifier
- `ttl` (optional): Time-to-live in seconds (default: 300)
- `scope` (optional): `'global'` or `'module'` (default: 'global')
- `moduleName` (optional): Required when scope is 'module'
- `serialize` (optional): Enable JSON serialization (default: true)

### RedisService

Comprehensive Redis service with full Redis operations support.

#### Core Methods

```typescript
// Basic operations
await redisService.set(key: string, value: any, ttl?: number): Promise<void>
await redisService.get(key: string): Promise<any>
await redisService.del(key: string): Promise<number>
await redisService.hasKey(key: string): Promise<boolean>

// Advanced operations
await redisService.flushAll(): Promise<void>
await redisService.keys(pattern: string): Promise<string[]>
await redisService.ttl(key: string): Promise<number>
await redisService.expire(key: string, ttl: number): Promise<boolean>

// Numeric operations
await redisService.increment(key: string, amount?: number): Promise<number>
await redisService.decrement(key: string, amount?: number): Promise<number>

// Access raw Redis client
const client = redisService.getClient(): Redis
```

## 🔧 Advanced Usage

### Custom Key Generation

```typescript
import { Injectable } from '@nestjs/common';
import { Cacheable } from 'nestjs-redis-cache';

@Injectable()
export class ProductService {
  @Cacheable({
    key: 'product:details',
    ttl: 1200,
  })
  async getProductDetails(productId: string, includeReviews: boolean) {
    // The cache key will be: "product:details"
    // Consider using dynamic keys for parameter-specific caching
    return await this.fetchProduct(productId, includeReviews);
  }

  // For parameter-specific caching, you might want to use RedisService directly
  async getProductWithDynamicCaching(productId: string, includeReviews: boolean) {
    const cacheKey = `product:${productId}:reviews:${includeReviews}`;
    
    let product = await this.redisService.get(cacheKey);
    if (!product) {
      product = await this.fetchProduct(productId, includeReviews);
      await this.redisService.set(cacheKey, product, 1200);
    }
    
    return product;
  }
}
```

### Error Handling and Fallbacks

The package provides automatic fallback to original methods when Redis operations fail:

```typescript
@Injectable()
export class ResilientService {
  @Cacheable({
    key: 'resilient:data',
    ttl: 300,
  })
  async getResilientData() {
    // If Redis is down, this method will still execute
    // and return the result without caching
    return await this.fetchImportantData();
  }
}
```

### Module-Scoped Caching

Organize cache keys by module for better management:

```typescript
// In UserModule
@Injectable()
export class UserService {
  @Cacheable({
    key: 'profile',
    scope: 'module',
    moduleName: 'UserModule',
    ttl: 600,
  })
  async getUserProfile(userId: string) {
    // Cache key: "UserModule:profile"
    return await this.fetchUserProfile(userId);
  }
}

// In ProductModule
@Injectable()
export class ProductService {
  @Cacheable({
    key: 'profile', // Same key name, different scope
    scope: 'module',
    moduleName: 'ProductModule',
    ttl: 600,
  })
  async getProductProfile(productId: string) {
    // Cache key: "ProductModule:profile"
    return await this.fetchProductProfile(productId);
  }
}
```

### Cache Invalidation Strategies

```typescript
@Injectable()
export class CacheManagementService {
  constructor(private readonly redisService: RedisService) {}

  async invalidateUserCache(userId: string) {
    // Invalidate all user-related cache entries
    const pattern = `*user:${userId}*`;
    const keys = await this.redisService.keys(pattern);
    
    for (const key of keys) {
      await this.redisService.del(key);
    }
  }

  async invalidateModuleCache(moduleName: string) {
    // Invalidate all cache entries for a specific module
    const pattern = `${moduleName}:*`;
    const keys = await this.redisService.keys(pattern);
    
    for (const key of keys) {
      await this.redisService.del(key);
    }
  }

  async warmUpCache() {
    // Pre-populate frequently accessed data
    const criticalData = await this.fetchCriticalData();
    await this.redisService.set('critical:data', criticalData, 3600);
  }
}
```

## 🧪 Testing

The package uses ioredis-mock for testing to ensure no real Redis dependency during tests.

### Example Test Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CachingModule } from 'nestjs-redis-cache';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        CachingModule.forRoot({
          redisUrl: 'redis://localhost:6379',
          keyPrefix: 'test:',
        }),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should cache user profile', async () => {
    const userId = '123';
    const profile = await service.getUserProfile(userId);
    
    // Second call should return cached result
    const cachedProfile = await service.getUserProfile(userId);
    
    expect(profile).toEqual(cachedProfile);
  });
});
```

## 🔒 Security Considerations

### Redis Configuration

```typescript
CachingModule.forRoot({
  redisUrl: 'redis://username:password@hostname:port/database',
  keyPrefix: 'secure:app:',
  defaultTtl: 300,
})
```

### Key Naming Best Practices

- Use descriptive, hierarchical key names
- Include version numbers for cache schema changes
- Use consistent naming conventions across your application

```typescript
@Cacheable({
  key: 'v1:user:profile:premium', // Version + entity + type + variant
  ttl: 600,
})
async getPremiumUserProfile(userId: string) {
  // Implementation
}
```

## ⚡ Performance Tips

1. **Choose appropriate TTL values**: Balance between data freshness and cache efficiency
2. **Use module scoping**: Organize cache keys for easier management and invalidation
3. **Monitor cache hit rates**: Use logging to track cache effectiveness
4. **Avoid caching frequently changing data**: Focus on stable, expensive-to-compute data
5. **Use compression for large objects**: Consider data size when caching complex objects

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Errors**: Ensure Redis is running and accessible
2. **Memory Issues**: Monitor Redis memory usage and set appropriate TTL values
3. **Serialization Errors**: Ensure cached data is JSON-serializable
4. **Key Conflicts**: Use module scoping or unique prefixes to avoid conflicts

### Debug Logging

Enable detailed logging for debugging:

```typescript
CachingModule.forRoot({
  redisUrl: 'redis://localhost:6379',
  logger: true, // Enable detailed logging
})
```

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check our documentation
- Review existing issues for solutions

---

Built with ❤️ for the NestJS community 
