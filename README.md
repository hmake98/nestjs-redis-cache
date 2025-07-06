# NestJS Redis Cache

A NestJS-compatible Redis caching package with explicit caching decorators and comprehensive Redis operations.

## Features

- 🚀 **Explicit Caching**: Use `@Cacheable()` decorator for explicit cache control
- 🔧 **Flexible Configuration**: Support for both sync and async module configuration
- 🛠️ **Comprehensive Redis Operations**: Full Redis service wrapper with all common operations
- 📊 **Global Logger Integration**: Built-in NestJS logger integration
- 🔑 **Smart Key Generation**: Global and module-level key scoping
- 🧪 **Comprehensive Test Coverage**: Extensive unit tests with high coverage
- 📦 **NPM Ready**: Fully typed TypeScript package

## Installation

```bash
npm install nestjs-redis-cache
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { CachingModule } from 'nestjs-redis-cache';

@Module({
  imports: [
    CachingModule.forRoot({
      redisUrl: process.env.REDIS_URL,
      // Optional: custom configuration
      keyPrefix: 'myapp:',
    }),
  ],
})
export class AppModule {}
```

### 2. Use the Cache Service

```typescript
import { Controller, Get } from '@nestjs/common';
import { RedisService, Cacheable } from 'nestjs-redis-cache';

@Controller()
export class SampleController {
  constructor(private readonly redisService: RedisService) {}

  @Cacheable({ key: 'user:profile', ttl: 60 })
  @Get('/user')
  async getUser() {
    // This result will be cached for 60 seconds
    return await this.userService.getUser();
  }

  @Get('/cache-stats')
  async getCacheStats() {
    const keys = await this.redisService.keys('*');
    return { totalKeys: keys.length };
  }
}
```

## API Reference

### CachingModule

#### `CachingModule.forRoot(options)`

Synchronous module configuration.

```typescript
CachingModule.forRoot({
  redisUrl: 'redis://localhost:6379',
  keyPrefix: 'myapp:', // Optional
})
```

#### `CachingModule.forRootAsync(options)`

Asynchronous module configuration.

```typescript
CachingModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    redisUrl: configService.get('REDIS_URL'),
    keyPrefix: configService.get('CACHE_PREFIX'),
  }),
  inject: [ConfigService],
})
```

### RedisService

The `RedisService` provides comprehensive Redis operations:

```typescript
import { RedisService } from 'nestjs-redis-cache';

@Injectable()
export class MyService {
  constructor(private readonly redisService: RedisService) {}

  // Basic operations
  async set(key: string, value: any, ttl?: number): Promise<void>
  async get(key: string): Promise<any>
  async del(key: string): Promise<number>
  async hasKey(key: string): Promise<boolean>
  async flushAll(): Promise<void>

  // Advanced operations
  async keys(pattern: string): Promise<string[]>
  async ttl(key: string): Promise<number>
  async expire(key: string, ttl: number): Promise<boolean>
  async increment(key: string, amount?: number): Promise<number>
  async decrement(key: string, amount?: number): Promise<number>
  
  // Get underlying Redis client
  getClient(): Redis
}
```

### @Cacheable Decorator

The `@Cacheable` decorator provides explicit caching control:

```typescript
@Cacheable({
  key: 'user:profile',           // Cache key (required)
  ttl: 60,                       // Time to live in seconds (optional, default: 300)
  scope: 'global',               // 'global' | 'module' (optional, default: 'global')
  moduleName: 'UserModule',      // Required when scope is 'module'
})
async getUserProfile() {
  // Method implementation
}
```

#### Options

- `key`: Cache key (required)
- `ttl`: Time to live in seconds (optional, default: 300)
- `scope`: Key scope - 'global' or 'module' (optional, default: 'global')
- `moduleName`: Module name (required when scope is 'module')

### Key Generator Utilities

The key generator utilities support global and module-level scoping:

```typescript
import { generateCacheKey, generatePrefixedCacheKey } from 'nestjs-redis-cache';

// Global scope
const globalKey = generateCacheKey('user:profile', 'global');

// Module scope
const moduleKey = generateCacheKey('user:profile', 'module', 'UserModule');

// With prefix
const prefixedKey = generatePrefixedCacheKey('user:profile', 'myapp:', 'module', 'UserModule');
```

## Configuration Options

| Option      | Type   | Default | Description                     |
| ----------- | ------ | ------- | ------------------------------- |
| `redisUrl`  | string | -       | Redis connection URL (required) |
| `keyPrefix` | string | ''      | Global key prefix (optional)    |

## Error Handling

The package includes comprehensive error handling:

- **Redis Connection Errors**: Automatically logged and handled gracefully
- **Cache Misses**: Fallback to original method execution
- **Invalid Configuration**: Clear error messages for misconfiguration
- **Module Scope Validation**: Warnings when module scope is used without moduleName

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Lint and format
npm run lint
npm run format
```

## Dependencies

### Peer Dependencies
- `@nestjs/common`: ^10.0.0
- `@nestjs/core`: ^10.0.0
- `reflect-metadata`: ^0.1.13

### Runtime Dependencies
- `ioredis`: ^5.3.0

## License

MIT 
