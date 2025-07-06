import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Create a mock Redis instance
    mockRedis = {
      set: jest.fn(),
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      flushall: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
      expire: jest.fn(),
      incrby: jest.fn(),
      decrby: jest.fn(),
      on: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RedisService,
          useFactory: () => new RedisService(mockRedis),
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should set a key-value pair without TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test' };

      await service.set(key, value);

      expect(mockRedis.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should set a key-value pair with TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      const ttl = 60;

      await service.set(key, value, ttl);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        key,
        ttl,
        JSON.stringify(value),
      );
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      const error = new Error('Redis connection failed');

      mockRedis.set.mockRejectedValue(error);

      await expect(service.set(key, value)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('get', () => {
    it('should get a value from Redis', async () => {
      const key = 'test:key';
      const value = { data: 'test' };

      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const key = 'test:key';

      mockRedis.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis connection failed');

      mockRedis.get.mockRejectedValue(error);

      await expect(service.get(key)).rejects.toThrow('Redis connection failed');
    });

    it('should handle JSON parsing errors', async () => {
      const key = 'test:key';

      mockRedis.get.mockResolvedValue('invalid json');

      await expect(service.get(key)).rejects.toThrow();
    });
  });

  describe('del', () => {
    it('should delete a key from Redis', async () => {
      const key = 'test:key';

      mockRedis.del.mockResolvedValue(1);

      const result = await service.del(key);

      expect(mockRedis.del).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis connection failed');

      mockRedis.del.mockRejectedValue(error);

      await expect(service.del(key)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('hasKey', () => {
    it('should return true for existing key', async () => {
      const key = 'test:key';

      mockRedis.exists.mockResolvedValue(1);

      const result = await service.hasKey(key);

      expect(mockRedis.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false for non-existing key', async () => {
      const key = 'test:key';

      mockRedis.exists.mockResolvedValue(0);

      const result = await service.hasKey(key);

      expect(result).toBe(false);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis connection failed');

      mockRedis.exists.mockRejectedValue(error);

      await expect(service.hasKey(key)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('flushAll', () => {
    it('should flush all keys from Redis', async () => {
      await service.flushAll();

      expect(mockRedis.flushall).toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const error = new Error('Redis connection failed');

      mockRedis.flushall.mockRejectedValue(error);

      await expect(service.flushAll()).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('keys', () => {
    it('should get keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2'];

      mockRedis.keys.mockResolvedValue(keys);

      const result = await service.keys(pattern);

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(result).toEqual(keys);
    });

    it('should handle Redis errors', async () => {
      const pattern = 'test:*';
      const error = new Error('Redis connection failed');

      mockRedis.keys.mockRejectedValue(error);

      await expect(service.keys(pattern)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('ttl', () => {
    it('should get TTL of a key', async () => {
      const key = 'test:key';
      const ttl = 60;

      mockRedis.ttl.mockResolvedValue(ttl);

      const result = await service.ttl(key);

      expect(mockRedis.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(ttl);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis connection failed');

      mockRedis.ttl.mockRejectedValue(error);

      await expect(service.ttl(key)).rejects.toThrow('Redis connection failed');
    });
  });

  describe('expire', () => {
    it('should set TTL of a key', async () => {
      const key = 'test:key';
      const ttl = 60;

      mockRedis.expire.mockResolvedValue(1);

      const result = await service.expire(key, ttl);

      expect(mockRedis.expire).toHaveBeenCalledWith(key, ttl);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const key = 'test:key';
      const ttl = 60;

      mockRedis.expire.mockResolvedValue(0);

      const result = await service.expire(key, ttl);

      expect(result).toBe(false);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const ttl = 60;
      const error = new Error('Redis connection failed');

      mockRedis.expire.mockRejectedValue(error);

      await expect(service.expire(key, ttl)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('increment', () => {
    it('should increment a numeric value with default amount', async () => {
      const key = 'test:counter';
      const newValue = 2;

      mockRedis.incrby.mockResolvedValue(newValue);

      const result = await service.increment(key);

      expect(mockRedis.incrby).toHaveBeenCalledWith(key, 1);
      expect(result).toBe(newValue);
    });

    it('should increment a numeric value with custom amount', async () => {
      const key = 'test:counter';
      const amount = 5;
      const newValue = 7;

      mockRedis.incrby.mockResolvedValue(newValue);

      const result = await service.increment(key, amount);

      expect(mockRedis.incrby).toHaveBeenCalledWith(key, amount);
      expect(result).toBe(newValue);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:counter';
      const error = new Error('Redis connection failed');

      mockRedis.incrby.mockRejectedValue(error);

      await expect(service.increment(key)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('decrement', () => {
    it('should decrement a numeric value with default amount', async () => {
      const key = 'test:counter';
      const newValue = 0;

      mockRedis.decrby.mockResolvedValue(newValue);

      const result = await service.decrement(key);

      expect(mockRedis.decrby).toHaveBeenCalledWith(key, 1);
      expect(result).toBe(newValue);
    });

    it('should decrement a numeric value with custom amount', async () => {
      const key = 'test:counter';
      const amount = 3;
      const newValue = 2;

      mockRedis.decrby.mockResolvedValue(newValue);

      const result = await service.decrement(key, amount);

      expect(mockRedis.decrby).toHaveBeenCalledWith(key, amount);
      expect(result).toBe(newValue);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:counter';
      const error = new Error('Redis connection failed');

      mockRedis.decrby.mockRejectedValue(error);

      await expect(service.decrement(key)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('getClient', () => {
    it('should return the Redis client', () => {
      const client = service.getClient();

      expect(client).toBe(mockRedis);
    });
  });

  describe('event handlers', () => {
    it('should setup event handlers on construction', () => {
      expect(mockRedis.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith(
        'reconnecting',
        expect.any(Function),
      );
    });

    it('should log error on redis error event', () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const redis = {
        on: jest.fn((event, cb) => {
          if (event === 'error') {
            cb('err');
          }
          return redis;
        }),
      };
      new RedisService(redis);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Redis connection error',
        'err',
      );
      loggerErrorSpy.mockRestore();
    });
  });

  describe('event handler coverage', () => {
    it('should log on connect, error, close, and reconnecting events', () => {
      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log');
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');
      const redis = { on: jest.fn() } as any;
      new RedisService(redis);
      // Find the event handlers
      const calls = redis.on.mock.calls;
      const handlers: Record<string, (...args: any[]) => void> = {};
      for (const [event, handler] of calls) {
        handlers[event] = handler;
      }
      // Simulate events
      handlers['connect']();
      handlers['error']('err');
      handlers['close']();
      handlers['reconnecting']();
      expect(loggerLogSpy).toHaveBeenCalledWith('Connected to Redis');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Redis connection error',
        'err',
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith('Redis connection closed');
      expect(loggerLogSpy).toHaveBeenCalledWith('Reconnecting to Redis...');
      loggerLogSpy.mockRestore();
      loggerErrorSpy.mockRestore();
      loggerWarnSpy.mockRestore();
    });
  });

  describe('constructor', () => {
    it('should setup event handlers on construction', () => {
      const setupEventHandlersSpy = jest.spyOn(
        RedisService.prototype as any,
        'setupEventHandlers',
      );

      new RedisService(mockRedis);

      expect(setupEventHandlersSpy).toHaveBeenCalled();
      setupEventHandlersSpy.mockRestore();
    });

    it('should create new instance and setup event handlers', () => {
      const service = new RedisService(mockRedis);
      expect(service).toBeInstanceOf(RedisService);
    });

    it('should create multiple instances with different mocks', () => {
      const mockRedis1 = { on: jest.fn() } as any;
      const mockRedis2 = { on: jest.fn() } as any;

      const service1 = new RedisService(mockRedis1);
      const service2 = new RedisService(mockRedis2);

      expect(service1).toBeInstanceOf(RedisService);
      expect(service2).toBeInstanceOf(RedisService);
      expect(mockRedis1.on).toHaveBeenCalled();
      expect(mockRedis2.on).toHaveBeenCalled();
    });
  });

  describe('event handler full branch coverage', () => {
    it('should trigger all event handlers and log appropriately', () => {
      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log');
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');
      const redis = { on: jest.fn() } as any;
      new RedisService(redis);
      const calls = redis.on.mock.calls;
      const handlers = {};
      for (const [event, handler] of calls) {
        handlers[event] = handler;
      }
      handlers['connect']();
      handlers['error']('err');
      handlers['close']();
      handlers['reconnecting']();
      expect(loggerLogSpy).toHaveBeenCalledWith('Connected to Redis');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Redis connection error',
        'err',
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith('Redis connection closed');
      expect(loggerLogSpy).toHaveBeenCalledWith('Reconnecting to Redis...');
      loggerLogSpy.mockRestore();
      loggerErrorSpy.mockRestore();
      loggerWarnSpy.mockRestore();
    });
  });
});
