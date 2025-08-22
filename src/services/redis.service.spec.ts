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
      quit: jest.fn(),
      disconnect: jest.fn(),
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

  describe('onModuleDestroy', () => {
    it('should gracefully shutdown Redis connection', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedis.quit).toHaveBeenCalled();
      expect(mockRedis.disconnect).not.toHaveBeenCalled();
    });

    it('should force disconnect if graceful shutdown fails', async () => {
      mockRedis.quit.mockRejectedValue(new Error('Quit failed'));

      await service.onModuleDestroy();

      expect(mockRedis.quit).toHaveBeenCalled();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
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

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.set('', 'value')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for non-string key', async () => {
      await expect(service.set(123 as any, 'value')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for null key', async () => {
      await expect(service.set(null as any, 'value')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for undefined key', async () => {
      await expect(service.set(undefined as any, 'value')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for invalid TTL (negative)', async () => {
      await expect(service.set('key', 'value', -1)).rejects.toThrow(
        'TTL must be a positive number',
      );
    });

    it('should throw error for invalid TTL (zero)', async () => {
      await expect(service.set('key', 'value', 0)).rejects.toThrow(
        'TTL must be a positive number',
      );
    });

    it('should throw error for non-number TTL', async () => {
      await expect(
        service.set('key', 'value', 'invalid' as any),
      ).rejects.toThrow('TTL must be a positive number');
    });

    it('should handle JSON serialization errors', async () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Create circular reference

      await expect(service.set('key', circularObj)).rejects.toThrow(
        'Failed to serialize value for key: key',
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

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis connection failed');

      mockRedis.get.mockRejectedValue(error);

      await expect(service.get(key)).rejects.toThrow('Redis connection failed');
    });

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.get('')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for non-string key', async () => {
      await expect(service.get(123 as any)).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockRedis.get.mockResolvedValue('invalid json {');

      await expect(service.get('key')).rejects.toThrow(
        'Failed to parse value for key: key',
      );
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

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.del('')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for non-string key', async () => {
      await expect(service.del(123 as any)).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });
  });

  describe('hasKey', () => {
    it('should return true when key exists', async () => {
      const key = 'test:key';

      mockRedis.exists.mockResolvedValue(1);

      const result = await service.hasKey(key);

      expect(mockRedis.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const key = 'test:key';

      mockRedis.exists.mockResolvedValue(0);

      const result = await service.hasKey(key);

      expect(mockRedis.exists).toHaveBeenCalledWith(key);
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

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.hasKey('')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });
  });

  describe('flushAll', () => {
    it('should flush all data from Redis', async () => {
      mockRedis.flushall.mockResolvedValue('OK');

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
    it('should get keys matching a pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2'];

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

    // New validation tests
    it('should throw error for empty pattern', async () => {
      await expect(service.keys('')).rejects.toThrow(
        'Pattern must be a non-empty string',
      );
    });

    it('should throw error for non-string pattern', async () => {
      await expect(service.keys(123 as any)).rejects.toThrow(
        'Pattern must be a non-empty string',
      );
    });
  });

  describe('ttl', () => {
    it('should get TTL of a key', async () => {
      const key = 'test:key';
      const ttl = 300;

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

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.ttl('')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });
  });

  describe('expire', () => {
    it('should set TTL for a key', async () => {
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

      expect(mockRedis.expire).toHaveBeenCalledWith(key, ttl);
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

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.expire('', 60)).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for invalid TTL (negative)', async () => {
      await expect(service.expire('key', -1)).rejects.toThrow(
        'TTL must be a positive number',
      );
    });

    it('should throw error for invalid TTL (zero)', async () => {
      await expect(service.expire('key', 0)).rejects.toThrow(
        'TTL must be a positive number',
      );
    });

    it('should throw error for non-number TTL', async () => {
      await expect(service.expire('key', 'invalid' as any)).rejects.toThrow(
        'TTL must be a positive number',
      );
    });
  });

  describe('increment', () => {
    it('should increment a key by default amount (1)', async () => {
      const key = 'test:counter';

      mockRedis.incrby.mockResolvedValue(1);

      const result = await service.increment(key);

      expect(mockRedis.incrby).toHaveBeenCalledWith(key, 1);
      expect(result).toBe(1);
    });

    it('should increment a key by custom amount', async () => {
      const key = 'test:counter';
      const amount = 5;

      mockRedis.incrby.mockResolvedValue(10);

      const result = await service.increment(key, amount);

      expect(mockRedis.incrby).toHaveBeenCalledWith(key, amount);
      expect(result).toBe(10);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:counter';
      const error = new Error('Redis connection failed');

      mockRedis.incrby.mockRejectedValue(error);

      await expect(service.increment(key)).rejects.toThrow(
        'Redis connection failed',
      );
    });

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.increment('')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for non-integer amount', async () => {
      await expect(service.increment('key', 1.5)).rejects.toThrow(
        'Amount must be an integer',
      );
    });

    it('should throw error for non-number amount', async () => {
      await expect(service.increment('key', 'invalid' as any)).rejects.toThrow(
        'Amount must be an integer',
      );
    });
  });

  describe('decrement', () => {
    it('should decrement a key by default amount (1)', async () => {
      const key = 'test:counter';

      mockRedis.decrby.mockResolvedValue(4);

      const result = await service.decrement(key);

      expect(mockRedis.decrby).toHaveBeenCalledWith(key, 1);
      expect(result).toBe(4);
    });

    it('should decrement a key by custom amount', async () => {
      const key = 'test:counter';
      const amount = 3;

      mockRedis.decrby.mockResolvedValue(2);

      const result = await service.decrement(key, amount);

      expect(mockRedis.decrby).toHaveBeenCalledWith(key, amount);
      expect(result).toBe(2);
    });

    it('should handle Redis errors', async () => {
      const key = 'test:counter';
      const error = new Error('Redis connection failed');

      mockRedis.decrby.mockRejectedValue(error);

      await expect(service.decrement(key)).rejects.toThrow(
        'Redis connection failed',
      );
    });

    // New validation tests
    it('should throw error for empty key', async () => {
      await expect(service.decrement('')).rejects.toThrow(
        'Key must be a non-empty string',
      );
    });

    it('should throw error for non-integer amount', async () => {
      await expect(service.decrement('key', 1.5)).rejects.toThrow(
        'Amount must be an integer',
      );
    });
  });

  describe('getClient', () => {
    it('should return the underlying Redis client', () => {
      const client = service.getClient();

      expect(client).toBe(mockRedis);
    });
  });

  describe('setupEventHandlers', () => {
    it('should set up Redis event handlers', () => {
      // Event handlers are set up in constructor, so verify they were called
      expect(mockRedis.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockRedis.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith(
        'reconnecting',
        expect.any(Function),
      );
      expect(mockRedis.on).toHaveBeenCalledWith('end', expect.any(Function));
    });

    it('should execute event handlers when events occur', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const handlers = Object.fromEntries(mockRedis.on.mock.calls);

      handlers.connect();
      handlers.ready();
      handlers.error(new Error('test'));
      handlers.close();
      handlers.reconnecting(500);
      handlers.end();

      expect(logSpy).toHaveBeenCalledWith('Connected to Redis');
      expect(logSpy).toHaveBeenCalledWith('Redis client ready');
      expect(errorSpy).toHaveBeenCalledWith(
        'Redis connection error',
        expect.any(Error),
      );
      expect(warnSpy).toHaveBeenCalledWith('Redis connection closed');
      expect(logSpy).toHaveBeenCalledWith('Reconnecting to Redis in 500ms...');
      expect(warnSpy).toHaveBeenCalledWith('Redis connection ended');

      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('constructor metadata', () => {
    it('should handle missing Redis export', () => {
      jest.resetModules();
      jest.doMock('ioredis', () => ({}));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { RedisService: RS } = require('./redis.service');
      const dummyRedis: any = {
        on: jest.fn(),
        quit: jest.fn(),
        disconnect: jest.fn(),
      };
      const instance = new RS(dummyRedis);
      expect(instance).toBeDefined();
      jest.dontMock('ioredis');
      jest.resetModules();
    });
  });
});
