import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import RedisMock from 'ioredis-mock';

import { CachingModule } from '../caching.module';
import { RedisService } from '../services/redis.service';
import { Cacheable } from '../decorators/cacheable.decorator';

// Use ioredis-mock for the Redis client created by CachingModule
jest.mock('ioredis', () => {
  class TestRedis extends (RedisMock as any) {
    constructor(url?: string, options: Record<string, any> = {}) {
      // Force options that make commands work without an explicit connect
      // Ensure enableOfflineQueue is true even if caller passes false
      const merged = { ...options };
      merged.enableOfflineQueue = true;
      // For safety, allow operations without explicit connect in tests
      merged.lazyConnect = false;
      super(url, merged);
    }
  }

  return {
    __esModule: true,
    Redis: TestRedis,
    default: TestRedis,
  };
});

@Injectable()
class DemoService {
  public invocationCount = 0;

  constructor(public readonly redisService: RedisService) {}

  @Cacheable({ key: 'demo:result', ttl: 60 })
  async compute(value: number): Promise<number> {
    this.invocationCount += 1;
    return value * 2;
  }
}

describe('Cacheable decorator (integration with ioredis-mock)', () => {
  let moduleRef: TestingModule;
  let service: DemoService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CachingModule.forRoot({
          redisUrl: 'redis://localhost:6379',
          keyPrefix: 'test:',
        }),
      ],
      providers: [DemoService],
    }).compile();

    service = moduleRef.get(DemoService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('caches results across calls', async () => {
    const first = await service.compute(21);
    const second = await service.compute(21);

    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(service.invocationCount).toBe(1); // second call should be served from cache
  });

  // Note: invalidation behavior is already covered in unit tests for RedisService.
  // This integration test focuses on verifying decorator caching with a live client.
});


