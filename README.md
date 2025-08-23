## nestjs-redis-cache

Production-ready Redis caching for NestJS with an explicit `@Cacheable` decorator, a typed `RedisService` wrapper around ioredis, and rich configuration (standalone, Sentinel, Cluster, TLS, retry/performance tuning).

### Features

- **Decorator-first caching**: `@Cacheable({ key, ttl, scope })` for explicit, predictable caching
- **Typed Redis client**: `RedisService` provides JSON-safe helpers for strings, hashes, lists, sets, sorted sets, pipelines, and transactions
- **Multiple topologies**: Standalone, Sentinel, and Cluster modes
- **Advanced config**: TLS, retry, performance, pooling, environment overrides, and presets
- **Builder utilities**: Fluent `RedisConfigBuilder` and quick `RedisConfigHelpers`
- **Nest-friendly**: Global module support, clean DI, and lifecycle handling

### Requirements

- Node.js 18+
- NestJS `@nestjs/common` ^8 | ^9 | ^10
- ioredis ^5

Peer deps (install in your app):

```bash
npm i ioredis reflect-metadata @nestjs/common
```

Then install this package:

```bash
npm i nestjs-redis-cache
```

Ensure your NestJS bootstrap imports `reflect-metadata` once (typical Nest apps already do this in main.ts).

### Quick start

1. Import the module (legacy/quick path):

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { CachingModule } from 'nestjs-redis-cache';

@Module({
    imports: [
        CachingModule.forRoot({
            redisUrl: 'redis://localhost:6379/0',
            keyPrefix: 'app:',
            defaultTtl: 300,
            logger: true,
        }),
    ],
})
export class AppModule {}
```

2. Use the service:

```ts
import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis-cache';

@Injectable()
export class UsersService {
    constructor(private readonly redis: RedisService) {}

    async cacheUser(userId: string, user: any) {
        await this.redis.set(`user:${userId}`, user, 300);
    }

    async getUser(userId: string) {
        return this.redis.get(`user:${userId}`);
    }
}
```

3. Or use the `@Cacheable` decorator for explicit caching of method results:

```ts
import { Injectable } from '@nestjs/common';
import { Cacheable } from 'nestjs-redis-cache';

@Injectable()
export class ReportService {
    // Caches the return value under key "report:daily" for 5 minutes
    @Cacheable({ key: 'report:daily', ttl: 300 })
    async buildDailyReport() {
        // ...expensive computation or IO
        return { ok: true };
    }
}
```

### Configuration

You can configure using a simple legacy shape (shown above) or the advanced, fully-typed configuration.

#### Advanced (recommended)

```ts
import { Module } from '@nestjs/common';
import { CachingModule, RedisConfigHelpers } from 'nestjs-redis-cache';

@Module({
    imports: [
        CachingModule.forRoot({
            // Use a preset as a base, then override
            redis: RedisConfigHelpers.production({
                keyPrefix: 'prod:',
                performance: { enableAutoPipelining: true },
            }),
        }),
    ],
})
export class AppModule {}
```

Or build it fluently:

```ts
import { createRedisConfig } from 'nestjs-redis-cache';

const redis = createRedisConfig()
    .setConnectionType('standalone')
    .host('localhost')
    .port(6379)
    .setKeyPrefix('app:')
    .setDefaultTtl(300)
    .setPerformance({ enableAutoPipelining: true, connectTimeout: 5000 })
    .setRetry({ retries: 3, retryDelayOnFailover: 1000 })
    .build();

// ...
CachingModule.forRoot({ redis });
```

#### Sentinel

```ts
CachingModule.forRoot({
    redis: {
        type: 'sentinel',
        keyPrefix: 'app:',
        sentinel: {
            sentinels: [
                { host: 'sentinel-1', port: 26379 },
                { host: 'sentinel-2', port: 26379 },
            ],
            name: 'mymaster',
            options: {
                enableReadyCheck: true,
            },
        },
        retry: { retries: 5, retryDelayOnFailover: 2000 },
    },
});
```

#### Cluster

```ts
CachingModule.forRoot({
    redis: {
        type: 'cluster',
        keyPrefix: 'app:',
        cluster: {
            nodes: [
                { host: 'redis-1', port: 6379 },
                { host: 'redis-2', port: 6379 },
            ],
            options: { scaleReads: 'slave' },
        },
        performance: { enableAutoPipelining: true },
    },
});
```

#### TLS

```ts
CachingModule.forRoot({
    redis: {
        type: 'standalone',
        url: 'rediss://secure-host:6380/0',
        tls: {
            enabled: true,
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
            // ca, cert, key supported
        },
    },
});
```

#### Async configuration

```ts
CachingModule.forRootAsync({
    useFactory: async () => ({
        // legacy input also supported here
        redisUrl: process.env.REDIS_URL!,
        keyPrefix: 'app:',
    }),
});
```

### RedisService API (selected)

- **Keys**: `set(key, value, ttl?)`, `get(key)`, `del(key)`, `exists(key)`, `ttl(key)`, `expire(key, ttl)`
- **Hash**: `hSet`, `hGet`, `hDel`, `hExists`, `hGetAll`, `hKeys`, `hVals`, `hLen`, `hMSet`, `hMGet`
- **List**: `lPush`, `rPush`, `lPop`, `rPop`, `lRange`, `lIndex`, `lSet`, `lTrim`, `lRem`, `lLen`
- **Set**: `sAdd`, `sRem`, `sIsMember`, `sMembers`, `sCard`, `sRandMember`, `sPop`, `sInter`, `sUnion`, `sDiff`
- **Sorted Set**: `zAdd`, `zRem`, `zRange`, `zRangeByScore`, `zRank`, `zScore`, `zCard`, `zCount`, `zIncrBy`
- **Advanced**: `mGet`, `mSet`, `scan`, `pipeline`, `multi`, `evalScript`, `getSet`, `getClient()`

Notes:

- Values are JSON-serialized on write and parsed on read. If parsing fails, a helpful error is thrown (or raw value returned where appropriate).
- Many methods validate inputs and throw explicit errors (e.g., empty key, invalid TTL).
- `pipeline`/`multi` accept either an array of `{ command, args }` or a callback to build commands imperatively.

### Cacheable decorator

```ts
@Cacheable({
  key: 'user:list',        // required, string
  ttl: 300,                // optional, seconds (default 300)
  scope: 'global' | 'module',
  // if scope === 'module', provide moduleName
  moduleName: 'users',
})
```

- The decorator logs cache hits/misses and falls back to the original method if Redis is unavailable.
- Cache keys are generated consistently using internal helpers and your provided `key`/scope.

### Utilities

- `generateCacheKey`, `generatePrefixedCacheKey`
- `RedisConfigBuilder`, `createRedisConfig`, `RedisConfigHelpers`, `getRedisConfigPresets`

### Best practices

- **Prefer SCAN over KEYS** in production for large datasets. Use `RedisService.scan`.
- **Set TTLs** for cached items to avoid stale data and memory growth.
- **Use pipelines/transactions** (`pipeline`, `multi`) for batching to reduce round-trips.
- **Prefix keys** per service/environment (`keyPrefix`) to avoid collisions.
- **Handle errors**: all methods throw explicit errors on invalid input or Redis failures—wrap calls when appropriate.
- **Avoid caching non-deterministic methods** with `@Cacheable`; choose idempotent computations.

### Troubleshooting

- TypeScript errors around TLS versions: use Node’s `SecureVersion` strings like `'TLSv1.2'`.
- If using Sentinel/Cluster in local tests, consider mocking or pointing to real instances.
- Ensure `ioredis` version ^5 is installed and only one `reflect-metadata` import exists in your app.

### Scripts

```bash
npm run build       # compile TS → dist
npm test            # run tests
npm run lint        # run ESLint
npm run lint:fix    # fix lint issues
npm run format      # format with Prettier
```

### Compatibility

- NestJS: ^8 | ^9 | ^10
- Node: 18+
- ioredis: ^5

### License

MIT © hmake98

### Links

- NestJS: [nestjs.com](https://nestjs.com)
- ioredis: [github.com/luin/ioredis](https://github.com/luin/ioredis)
