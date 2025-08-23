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
            // Hash operations
            hset: jest.fn(),
            hget: jest.fn(),
            hdel: jest.fn(),
            hexists: jest.fn(),
            hgetall: jest.fn(),
            hkeys: jest.fn(),
            hvals: jest.fn(),
            hlen: jest.fn(),
            hmset: jest.fn(),
            hmget: jest.fn(),
            // List operations
            lpush: jest.fn(),
            rpush: jest.fn(),
            lpop: jest.fn(),
            rpop: jest.fn(),
            lrange: jest.fn(),
            llen: jest.fn(),
            lindex: jest.fn(),
            lset: jest.fn(),
            ltrim: jest.fn(),
            lrem: jest.fn(),
            // Advanced operations
            mget: jest.fn(),
            mset: jest.fn(),
            scan: jest.fn(),
            pipeline: jest.fn().mockReturnValue({
                set: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnThis(),
                exec: jest.fn(),
            }),
            multi: jest.fn().mockReturnValue({
                set: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnThis(),
                exec: jest.fn(),
            }),
            eval: jest.fn(),
            getset: jest.fn(),
            // Sorted set operations
            zrank: jest.fn(),
            zscore: jest.fn(),
            zcard: jest.fn(),
            zcount: jest.fn(),
            zincrby: jest.fn(),
            // Connection management
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

            expect(mockRedis.set).toHaveBeenCalledWith(
                key,
                JSON.stringify(value),
            );
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
            await expect(
                service.set(undefined as any, 'value'),
            ).rejects.toThrow('Key must be a non-empty string');
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

            await expect(service.get(key)).rejects.toThrow(
                'Redis connection failed',
            );
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

        it('should handle deleting non-existent key', async () => {
            const key = 'non-existent-key';

            mockRedis.del.mockResolvedValue(0);

            const result = await service.del(key);

            expect(mockRedis.del).toHaveBeenCalledWith(key);
            expect(result).toBe(0);
        });

        it('should handle Redis errors', async () => {
            const key = 'test:key';
            const error = new Error('Redis connection failed');

            mockRedis.del.mockRejectedValue(error);

            await expect(service.del(key)).rejects.toThrow(
                'Redis connection failed',
            );
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

            await expect(service.ttl(key)).rejects.toThrow(
                'Redis connection failed',
            );
        });

        // New validation tests
        it('should throw error for empty key', async () => {
            await expect(service.ttl('')).rejects.toThrow(
                'Key must be a non-empty string',
            );
        });
    });

    describe('ttl in-memory fallback branches', () => {
        // no-op

        afterEach(() => {
            jest.spyOn(Date, 'now').mockRestore();
        });

        it('should return remaining seconds when memory TTL is positive (covers remainingMs > 0)', async () => {
            const key = 'mem-positive-ttl';
            // Fix the current time
            jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
            // expires in 4000ms => ceil(4_000/1000) = 4
            (service as any)['memoryStore'].set(key, {
                value: '"v"',
                expiresAt: 1_004_000,
            });

            const ttl = await service.ttl(key);
            expect(ttl).toBe(4);
        });

        it('should return -2 when memory TTL expired (covers remainingMs <= 0)', async () => {
            const key = 'mem-expired-ttl';
            jest.spyOn(Date, 'now').mockReturnValue(2_000_000);
            // expired 1ms ago
            (service as any)['memoryStore'].set(key, {
                value: '"v"',
                expiresAt: 1_999_999,
            });

            const ttl = await service.ttl(key);
            expect(ttl).toBe(-2);
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
            await expect(
                service.expire('key', 'invalid' as any),
            ).rejects.toThrow('TTL must be a positive number');
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
            await expect(
                service.increment('key', 'invalid' as any),
            ).rejects.toThrow('Amount must be an integer');
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
            expect(mockRedis.on).toHaveBeenCalledWith(
                'ready',
                expect.any(Function),
            );
            expect(mockRedis.on).toHaveBeenCalledWith(
                'error',
                expect.any(Function),
            );
            expect(mockRedis.on).toHaveBeenCalledWith(
                'close',
                expect.any(Function),
            );
            expect(mockRedis.on).toHaveBeenCalledWith(
                'reconnecting',
                expect.any(Function),
            );
            expect(mockRedis.on).toHaveBeenCalledWith(
                'end',
                expect.any(Function),
            );
        });

        it('should execute event handlers when events occur', () => {
            const logSpy = jest
                .spyOn(Logger.prototype, 'log')
                .mockImplementation();
            const errorSpy = jest
                .spyOn(Logger.prototype, 'error')
                .mockImplementation();
            const warnSpy = jest
                .spyOn(Logger.prototype, 'warn')
                .mockImplementation();

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
            expect(logSpy).toHaveBeenCalledWith(
                'Reconnecting to Redis in 500ms...',
            );
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

    describe('getTtl', () => {
        it('should get TTL of a key', async () => {
            const key = 'test:key';
            const ttl = 300;

            mockRedis.ttl.mockResolvedValue(ttl);

            const result = await service.getTtl(key);

            expect(mockRedis.ttl).toHaveBeenCalledWith(key);
            expect(result).toBe(ttl);
        });

        it('should throw error for empty key', async () => {
            await expect(service.getTtl('')).rejects.toThrow(
                'Key must be a non-empty string',
            );
        });

        it('should handle Redis errors', async () => {
            const error = new Error('Redis connection failed');
            mockRedis.ttl.mockRejectedValue(error);

            await expect(service.getTtl('key')).rejects.toThrow(
                'Redis connection failed',
            );
        });
    });

    describe('setTtl', () => {
        it('should set TTL for a key', async () => {
            const key = 'test:key';
            const ttl = 60;

            mockRedis.expire.mockResolvedValue(1);

            const result = await service.setTtl(key, ttl);

            expect(mockRedis.expire).toHaveBeenCalledWith(key, ttl);
            expect(result).toBe(true);
        });

        it('should throw error for empty key', async () => {
            await expect(service.setTtl('', 60)).rejects.toThrow(
                'Key must be a non-empty string',
            );
        });

        it('should throw error for invalid TTL', async () => {
            await expect(service.setTtl('key', -1)).rejects.toThrow(
                'TTL must be a positive number',
            );
        });
    });

    describe('Hash Operations', () => {
        describe('hSet', () => {
            it('should set a hash field (create new)', async () => {
                const key = 'test:hash';
                const field = 'name';
                const value = 'John Doe';

                mockRedis.hset.mockResolvedValue(1);

                const result = await service.hSet(key, field, value);

                expect(mockRedis.hset).toHaveBeenCalledWith(
                    key,
                    field,
                    JSON.stringify(value),
                );
                expect(result).toBe(1);
            });

            it('should set a hash field (update existing)', async () => {
                const key = 'test:hash';
                const field = 'name';
                const value = 'Jane Doe';

                mockRedis.hset.mockResolvedValue(0);

                const result = await service.hSet(key, field, value);

                expect(mockRedis.hset).toHaveBeenCalledWith(
                    key,
                    field,
                    JSON.stringify(value),
                );
                expect(result).toBe(0);
            });

            it('should throw error for empty key', async () => {
                await expect(
                    service.hSet('', 'field', 'value'),
                ).rejects.toThrow('Key must be a non-empty string');
            });

            it('should throw error for empty field', async () => {
                await expect(service.hSet('key', '', 'value')).rejects.toThrow(
                    'Field must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hset.mockRejectedValue(error);

                await expect(
                    service.hSet('key', 'field', 'value'),
                ).rejects.toThrow('Redis connection failed');
            });
        });

        describe('hGet', () => {
            it('should get a hash field', async () => {
                const key = 'test:hash';
                const field = 'name';
                const value = 'John Doe';

                mockRedis.hget.mockResolvedValue(JSON.stringify(value));

                const result = await service.hGet(key, field);

                expect(mockRedis.hget).toHaveBeenCalledWith(key, field);
                expect(result).toBe(value);
            });

            it('should return null for non-existent field', async () => {
                mockRedis.hget.mockResolvedValue(null);

                const result = await service.hGet('key', 'field');

                expect(result).toBeNull();
            });

            it('should throw error for JSON parsing failure', async () => {
                mockRedis.hget.mockResolvedValue('invalid json {');

                await expect(service.hGet('key', 'field')).rejects.toThrow(
                    'Failed to parse value for hash field: key.field',
                );
            });

            it('should throw error for empty key', async () => {
                await expect(service.hGet('', 'field')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for empty field', async () => {
                await expect(service.hGet('key', '')).rejects.toThrow(
                    'Field must be a non-empty string',
                );
            });
        });

        describe('hDel', () => {
            it('should delete a hash field', async () => {
                const key = 'test:hash';
                const field = 'name';

                mockRedis.hdel.mockResolvedValue(1);

                const result = await service.hDel(key, field);

                expect(mockRedis.hdel).toHaveBeenCalledWith(key, field);
                expect(result).toBe(1);
            });

            it('should return 0 for non-existent field', async () => {
                mockRedis.hdel.mockResolvedValue(0);

                const result = await service.hDel('key', 'field');

                expect(result).toBe(0);
            });

            it('should throw error for empty key', async () => {
                await expect(service.hDel('', 'field')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for empty field', async () => {
                await expect(service.hDel('key', '')).rejects.toThrow(
                    'Field must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hdel.mockRejectedValue(error);

                await expect(service.hDel('key', 'field')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('hExists', () => {
            it('should check if hash field exists', async () => {
                const key = 'test:hash';
                const field = 'name';

                mockRedis.hexists.mockResolvedValue(1);

                const result = await service.hExists(key, field);

                expect(mockRedis.hexists).toHaveBeenCalledWith(key, field);
                expect(result).toBe(true);
            });

            it('should return false for non-existent field', async () => {
                mockRedis.hexists.mockResolvedValue(0);

                const result = await service.hExists('key', 'field');

                expect(result).toBe(false);
            });

            it('should throw error for empty key', async () => {
                await expect(service.hExists('', 'field')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for empty field', async () => {
                await expect(service.hExists('key', '')).rejects.toThrow(
                    'Field must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hexists.mockRejectedValue(error);

                await expect(service.hExists('key', 'field')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('hGetAll', () => {
            it('should get all hash fields', async () => {
                const key = 'test:hash';
                const hashData = {
                    name: '"John Doe"',
                    age: '30',
                    active: 'true',
                };

                mockRedis.hgetall.mockResolvedValue(hashData);

                const result = await service.hGetAll(key);

                expect(mockRedis.hgetall).toHaveBeenCalledWith(key);
                expect(result).toEqual({
                    name: 'John Doe',
                    age: 30,
                    active: true,
                });
            });

            it('should handle empty hash', async () => {
                mockRedis.hgetall.mockResolvedValue({});

                const result = await service.hGetAll('key');

                expect(result).toEqual({});
            });

            it('should handle JSON parsing errors gracefully', async () => {
                const hashData = {
                    valid: '"valid value"',
                    invalid: 'invalid json {',
                };

                mockRedis.hgetall.mockResolvedValue(hashData);

                const result = await service.hGetAll('key');

                expect(result).toEqual({
                    valid: 'valid value',
                    invalid: 'invalid json {',
                });
            });

            it('should throw error for empty key', async () => {
                await expect(service.hGetAll('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hgetall.mockRejectedValue(error);

                await expect(service.hGetAll('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('hKeys', () => {
            it('should get all hash field names', async () => {
                const key = 'test:hash';
                const fields = ['name', 'age', 'active'];

                mockRedis.hkeys.mockResolvedValue(fields);

                const result = await service.hKeys(key);

                expect(mockRedis.hkeys).toHaveBeenCalledWith(key);
                expect(result).toEqual(fields);
            });

            it('should throw error for empty key', async () => {
                await expect(service.hKeys('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hkeys.mockRejectedValue(error);

                await expect(service.hKeys('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('hVals', () => {
            it('should get all hash values', async () => {
                const key = 'test:hash';
                const values = ['"John Doe"', '30', 'true'];

                mockRedis.hvals.mockResolvedValue(values);

                const result = await service.hVals(key);

                expect(mockRedis.hvals).toHaveBeenCalledWith(key);
                expect(result).toEqual(['John Doe', 30, true]);
            });

            it('should handle JSON parsing errors gracefully', async () => {
                const values = ['"valid"', 'invalid json {'];

                mockRedis.hvals.mockResolvedValue(values);

                const result = await service.hVals('key');

                expect(result).toEqual(['valid', 'invalid json {']);
            });

            it('should throw error for empty key', async () => {
                await expect(service.hVals('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hvals.mockRejectedValue(error);

                await expect(service.hVals('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('hLen', () => {
            it('should get hash field count', async () => {
                const key = 'test:hash';

                mockRedis.hlen.mockResolvedValue(3);

                const result = await service.hLen(key);

                expect(mockRedis.hlen).toHaveBeenCalledWith(key);
                expect(result).toBe(3);
            });

            it('should throw error for empty key', async () => {
                await expect(service.hLen('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hlen.mockRejectedValue(error);

                await expect(service.hLen('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });
    });

    describe('List Operations', () => {
        describe('lPush', () => {
            it('should push value to left of list', async () => {
                const key = 'test:list';
                const value = { id: 1, name: 'Item 1' };

                mockRedis.lpush.mockResolvedValue(2);

                const result = await service.lPush(key, value);

                expect(mockRedis.lpush).toHaveBeenCalledWith(
                    key,
                    JSON.stringify(value),
                );
                expect(result).toBe(2);
            });

            it('should throw error for empty key', async () => {
                await expect(service.lPush('', 'value')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.lpush.mockRejectedValue(error);

                await expect(service.lPush('key', 'value')).rejects.toThrow(
                    'Redis connection failed',
                );
            });

            it('should throw error when no values provided', async () => {
                await expect(service.lPush('key')).rejects.toThrow(
                    'At least one value must be provided',
                );
            });
        });

        describe('rPush', () => {
            it('should push value to right of list', async () => {
                const key = 'test:list';
                const value = { id: 2, name: 'Item 2' };

                mockRedis.rpush.mockResolvedValue(3);

                const result = await service.rPush(key, value);

                expect(mockRedis.rpush).toHaveBeenCalledWith(
                    key,
                    JSON.stringify(value),
                );
                expect(result).toBe(3);
            });

            it('should throw error for empty key', async () => {
                await expect(service.rPush('', 'value')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.rpush.mockRejectedValue(error);

                await expect(service.rPush('key', 'value')).rejects.toThrow(
                    'Redis connection failed',
                );
            });

            it('should throw error when no values provided', async () => {
                await expect(service.rPush('key')).rejects.toThrow(
                    'At least one value must be provided',
                );
            });
        });

        describe('lPop', () => {
            it('should pop value from left of list', async () => {
                const key = 'test:list';
                const value = { id: 1, name: 'Item 1' };

                (mockRedis.lpop as any).mockResolvedValue(
                    JSON.stringify(value),
                );

                const result = await service.lPop(key);

                expect(mockRedis.lpop).toHaveBeenCalledWith(key);
                expect(result).toEqual(value);
            });

            it('should return null for empty list', async () => {
                mockRedis.lpop.mockResolvedValue(null);

                const result = await service.lPop('key');

                expect(result).toBeNull();
            });

            it('should handle JSON parsing errors', async () => {
                (mockRedis.lpop as any).mockResolvedValue('invalid json {');

                await expect(service.lPop('key')).rejects.toThrow(
                    'Failed to parse list value for key: key',
                );
            });

            it('should throw error for empty key', async () => {
                await expect(service.lPop('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.lpop.mockRejectedValue(error);

                await expect(service.lPop('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('rPop', () => {
            it('should pop value from right of list', async () => {
                const key = 'test:list';
                const value = { id: 2, name: 'Item 2' };

                (mockRedis.rpop as any).mockResolvedValue(
                    JSON.stringify(value),
                );

                const result = await service.rPop(key);

                expect(mockRedis.rpop).toHaveBeenCalledWith(key);
                expect(result).toEqual(value);
            });

            it('should return null for empty list', async () => {
                mockRedis.rpop.mockResolvedValue(null);

                const result = await service.rPop('key');

                expect(result).toBeNull();
            });

            it('should throw error for empty key', async () => {
                await expect(service.rPop('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle JSON parsing errors', async () => {
                (mockRedis.rpop as any).mockResolvedValue('invalid json {');

                await expect(service.rPop('key')).rejects.toThrow(
                    'Failed to parse list value for key: key',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.rpop.mockRejectedValue(error);

                await expect(service.rPop('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('lRange', () => {
            it('should get list range', async () => {
                const key = 'test:list';
                const values = [
                    JSON.stringify({ id: 1 }),
                    JSON.stringify({ id: 2 }),
                ];

                mockRedis.lrange.mockResolvedValue(values);

                const result = await service.lRange(key, 0, -1);

                expect(mockRedis.lrange).toHaveBeenCalledWith(key, 0, -1);
                expect(result).toEqual([{ id: 1 }, { id: 2 }]);
            });

            it('should handle empty list', async () => {
                mockRedis.lrange.mockResolvedValue([]);

                const result = await service.lRange('key', 0, -1);

                expect(result).toEqual([]);
            });

            it('should throw error for empty key', async () => {
                await expect(service.lRange('', 0, -1)).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid range', async () => {
                await expect(
                    service.lRange('key', 'invalid' as any, -1),
                ).rejects.toThrow('Start and stop must be numbers');
            });

            it('should handle JSON parsing errors gracefully', async () => {
                const values = ['"valid"', 'invalid json {'];
                mockRedis.lrange.mockResolvedValue(values);

                const result = await service.lRange('key', 0, -1);

                expect(result).toEqual(['valid', 'invalid json {']);
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.lrange.mockRejectedValue(error);

                await expect(service.lRange('key', 0, -1)).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('lLen', () => {
            it('should get list length', async () => {
                const key = 'test:list';

                mockRedis.llen.mockResolvedValue(5);

                const result = await service.lLen(key);

                expect(mockRedis.llen).toHaveBeenCalledWith(key);
                expect(result).toBe(5);
            });

            it('should throw error for empty key', async () => {
                await expect(service.lLen('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.llen.mockRejectedValue(error);

                await expect(service.lLen('key')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('lIndex', () => {
            it('should get list element at index', async () => {
                const key = 'test:list';
                const value = { id: 1, name: 'Item 1' };

                mockRedis.lindex.mockResolvedValue(JSON.stringify(value));

                const result = await service.lIndex(key, 0);

                expect(mockRedis.lindex).toHaveBeenCalledWith(key, 0);
                expect(result).toEqual(value);
            });

            it('should return null for invalid index', async () => {
                mockRedis.lindex.mockResolvedValue(null);

                const result = await service.lIndex('key', 100);

                expect(result).toBeNull();
            });

            it('should throw error for empty key', async () => {
                await expect(service.lIndex('', 0)).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid index type', async () => {
                await expect(
                    service.lIndex('key', 'invalid' as any),
                ).rejects.toThrow('Index must be a number');
            });

            it('should handle JSON parsing errors', async () => {
                mockRedis.lindex.mockResolvedValue('invalid json {');

                await expect(service.lIndex('key', 0)).rejects.toThrow(
                    'Failed to parse list value for key: key',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.lindex.mockRejectedValue(error);

                await expect(service.lIndex('key', 0)).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('lSet', () => {
            it('should set list element at index', async () => {
                const key = 'test:list';
                const index = 0;
                const value = { id: 1, name: 'Updated Item' };

                mockRedis.lset.mockResolvedValue('OK');

                await service.lSet(key, index, value);

                expect(mockRedis.lset).toHaveBeenCalledWith(
                    key,
                    index,
                    JSON.stringify(value),
                );
            });

            it('should throw error for empty key', async () => {
                await expect(service.lSet('', 0, 'value')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid index', async () => {
                await expect(
                    service.lSet('key', 'invalid' as any, 'value'),
                ).rejects.toThrow('Index must be a number');
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.lset.mockRejectedValue(error);

                await expect(service.lSet('key', 0, 'value')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('lTrim', () => {
            it('should trim list to specified range', async () => {
                const key = 'test:list';

                mockRedis.ltrim.mockResolvedValue('OK');

                await service.lTrim(key, 0, 2);

                expect(mockRedis.ltrim).toHaveBeenCalledWith(key, 0, 2);
            });

            it('should throw error for empty key', async () => {
                await expect(service.lTrim('', 0, 2)).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid range', async () => {
                await expect(
                    service.lTrim('key', 'invalid' as any, 2),
                ).rejects.toThrow('Start and stop must be numbers');
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.ltrim.mockRejectedValue(error);

                await expect(service.lTrim('key', 0, 2)).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('lRem', () => {
            it('should remove elements from list', async () => {
                const key = 'test:list';
                const value = { id: 1, name: 'Item to remove' };

                mockRedis.lrem.mockResolvedValue(2);

                const result = await service.lRem(key, 0, value);

                expect(mockRedis.lrem).toHaveBeenCalledWith(
                    key,
                    0,
                    JSON.stringify(value),
                );
                expect(result).toBe(2);
            });

            it('should throw error for empty key', async () => {
                await expect(service.lRem('', 0, 'value')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid count', async () => {
                await expect(
                    service.lRem('key', 'invalid' as any, 'value'),
                ).rejects.toThrow('Count must be a number');
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.lrem.mockRejectedValue(error);

                await expect(service.lRem('key', 0, 'value')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });
    });

    describe('Advanced Operations', () => {
        describe('mGet', () => {
            it('should get multiple keys', async () => {
                const keys = ['key1', 'key2', 'key3'];
                const values = ['"value1"', '"value2"', null];

                mockRedis.mget.mockResolvedValue(values);

                const result = await service.mGet(keys);

                expect(mockRedis.mget).toHaveBeenCalledWith(...keys);
                expect(result).toEqual(['value1', 'value2', null]);
            });

            it('should handle JSON parsing errors gracefully', async () => {
                const keys = ['key1', 'key2'];
                const values = ['"valid"', 'invalid json {'];

                mockRedis.mget.mockResolvedValue(values);

                const result = await service.mGet(keys);

                expect(result).toEqual(['valid', 'invalid json {']);
            });

            it('should throw error for empty keys array', async () => {
                await expect(service.mGet([])).rejects.toThrow(
                    'Keys must be a non-empty array',
                );
            });

            it('should throw error for non-array keys', async () => {
                await expect(service.mGet('not-array' as any)).rejects.toThrow(
                    'Keys must be a non-empty array',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.mget.mockRejectedValue(error);

                await expect(service.mGet(['key1', 'key2'])).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('mSet', () => {
            it('should set multiple key-value pairs', async () => {
                const keyValues = {
                    key1: 'value1',
                    key2: { id: 1 },
                    key3: 123,
                };

                mockRedis.mset.mockResolvedValue('OK');

                await service.mSet(keyValues);

                expect(mockRedis.mset).toHaveBeenCalledWith(
                    'key1',
                    '"value1"',
                    'key2',
                    '{"id":1}',
                    'key3',
                    '123',
                );
            });

            it('should throw error for empty object', async () => {
                await expect(service.mSet({})).rejects.toThrow(
                    'At least one key-value pair must be provided',
                );
            });

            it('should throw error for non-object input', async () => {
                await expect(service.mSet('not-object' as any)).rejects.toThrow(
                    'KeyValues must be an object',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.mset.mockRejectedValue(error);

                await expect(service.mSet({ key1: 'value1' })).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('scan', () => {
            it('should scan keys with cursor only', async () => {
                const cursor = '0';

                mockRedis.scan.mockResolvedValue(['10', ['key1', 'key2']]);

                const result = await service.scan(cursor);

                expect(mockRedis.scan).toHaveBeenCalledWith(cursor);
                expect(result).toEqual({
                    cursor: '10',
                    keys: ['key1', 'key2'],
                });
            });

            it('should scan keys with pattern and count', async () => {
                const cursor = '0';
                const pattern = 'user:*';
                const count = 100;

                mockRedis.scan.mockResolvedValue(['0', ['user:1', 'user:2']]);

                const result = await service.scan(cursor, pattern, count);

                expect(mockRedis.scan).toHaveBeenCalledWith(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    count,
                );
                expect(result).toEqual({
                    cursor: '0',
                    keys: ['user:1', 'user:2'],
                });
            });

            it('should throw error for empty cursor', async () => {
                await expect(service.scan('')).rejects.toThrow(
                    'Cursor must be a non-empty string',
                );
            });

            it('should throw error for invalid count', async () => {
                await expect(service.scan('0', undefined, -1)).rejects.toThrow(
                    'Count must be a positive number',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.scan.mockRejectedValue(error);

                await expect(service.scan('0')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });
    });

    describe('Large key set warning', () => {
        it('should warn about large key sets', async () => {
            const warnSpy = jest
                .spyOn(service['logger'], 'warn')
                .mockImplementation();
            const pattern = 'test:*';
            const largeKeySet = Array.from(
                { length: 150 },
                (_, i) => `key${i}`,
            );

            mockRedis.keys.mockResolvedValue(largeKeySet);

            await service.keys(pattern);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    'Large key set returned for pattern: test:* (150 keys)',
                ),
            );

            warnSpy.mockRestore();
        });
    });

    describe('Missing Hash Operations', () => {
        describe('hMSet', () => {
            it('should set multiple hash fields', async () => {
                const key = 'test:hash';
                const data = {
                    field1: 'value1',
                    field2: { id: 1 },
                    field3: 123,
                };

                mockRedis.hmset.mockResolvedValue('OK');

                await service.hMSet(key, data);

                expect(mockRedis.hmset).toHaveBeenCalledWith(
                    key,
                    'field1',
                    '"value1"',
                    'field2',
                    '{"id":1}',
                    'field3',
                    '123',
                );
            });

            it('should throw error for empty key', async () => {
                await expect(
                    service.hMSet('', { field: 'value' }),
                ).rejects.toThrow('Key must be a non-empty string');
            });

            it('should throw error for invalid data', async () => {
                await expect(service.hMSet('key', null as any)).rejects.toThrow(
                    'Data must be an object',
                );
            });

            it('should handle serialization errors', async () => {
                const key = 'test:hash';
                const circularObj: any = { name: 'test' };
                circularObj.self = circularObj;

                await expect(
                    service.hMSet(key, { circular: circularObj }),
                ).rejects.toThrow(
                    'Failed to serialize value for hash field: test:hash.circular',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hmset.mockRejectedValue(error);

                await expect(
                    service.hMSet('key', { field: 'value' }),
                ).rejects.toThrow('Redis connection failed');
            });
        });

        describe('hMGet', () => {
            it('should get multiple hash fields', async () => {
                const key = 'test:hash';
                const fields = ['field1', 'field2', 'field3'];
                const values = ['"value1"', '{"id":1}', null];

                mockRedis.hmget.mockResolvedValue(values);

                const result = await service.hMGet(key, fields);

                expect(mockRedis.hmget).toHaveBeenCalledWith(key, ...fields);
                expect(result).toEqual(['value1', { id: 1 }, null]);
            });

            it('should handle JSON parsing errors gracefully', async () => {
                const key = 'test:hash';
                const fields = ['field1', 'field2'];
                const values = ['"valid"', 'invalid json {'];

                mockRedis.hmget.mockResolvedValue(values);

                const result = await service.hMGet(key, fields);

                expect(result).toEqual(['valid', 'invalid json {']);
            });

            it('should throw error for empty key', async () => {
                await expect(service.hMGet('', ['field'])).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for empty fields array', async () => {
                await expect(service.hMGet('key', [])).rejects.toThrow(
                    'Fields must be a non-empty array',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.hmget.mockRejectedValue(error);

                await expect(service.hMGet('key', ['field'])).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });
    });

    describe('Advanced Redis Operations', () => {
        describe('pipeline', () => {
            it('should create and execute a pipeline', async () => {
                const mockPipeline = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        ['OK', null],
                        [null, '"value"'],
                    ]),
                };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                const result = await service.pipeline((pipe) => {
                    pipe.set('key1', 'value1');
                    pipe.get('key2');
                });

                expect(mockRedis.pipeline).toHaveBeenCalled();
                expect(mockPipeline.exec).toHaveBeenCalled();
                expect(result).toEqual([
                    ['OK', null],
                    [null, '"value"'],
                ]);
            });

            it('should handle pipeline execution errors', async () => {
                const mockPipeline = {
                    set: jest.fn().mockReturnThis(),
                    exec: jest
                        .fn()
                        .mockRejectedValue(new Error('Pipeline failed')),
                };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                await expect(
                    service.pipeline((pipe) => {
                        pipe.set('key', 'value');
                    }),
                ).rejects.toThrow('Pipeline failed');
            });

            it('should execute commands array in pipeline', async () => {
                const mockPipeline = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        ['OK', null],
                        [null, '"value"'],
                    ]),
                };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                const commands = [
                    { command: 'set', args: ['key1', 'value1'] },
                    { command: 'get', args: ['key2'] },
                ];

                const result = await service.pipeline(commands);

                expect(mockRedis.pipeline).toHaveBeenCalled();
                expect(mockPipeline.set).toHaveBeenCalledWith('key1', 'value1');
                expect(mockPipeline.get).toHaveBeenCalledWith('key2');
                expect(result).toEqual([
                    ['OK', null],
                    [null, '"value"'],
                ]);
            });

            it('should throw error for empty commands array in pipeline', async () => {
                await expect(service.pipeline([])).rejects.toThrow(
                    'Commands must be a non-empty array',
                );
            });

            it('should throw error for invalid command type in pipeline', async () => {
                const commands = [{ command: 123 as any, args: [] }];
                const mockPipeline = { exec: jest.fn() };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                await expect(service.pipeline(commands)).rejects.toThrow(
                    'Command must be a string',
                );
            });

            it('should throw error for invalid args type in pipeline', async () => {
                const commands = [{ command: 'set', args: 'not-array' as any }];
                const mockPipeline = { exec: jest.fn() };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                await expect(service.pipeline(commands)).rejects.toThrow(
                    'Args must be an array',
                );
            });

            it('should handle pipeline execution errors with array commands', async () => {
                const error = new Error('Pipeline failed');
                mockRedis.pipeline.mockImplementation(() => {
                    throw error;
                });

                const commands = [{ command: 'set', args: ['key', 'value'] }];
                await expect(service.pipeline(commands)).rejects.toThrow(
                    'Pipeline failed',
                );
            });

            it('should handle pipeline execution returning null', async () => {
                const mockPipeline = {
                    set: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue(null),
                };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                const commands = [{ command: 'set', args: ['key', 'value'] }];
                await expect(service.pipeline(commands)).rejects.toThrow(
                    'Pipeline execution failed',
                );
            });

            it('should handle individual command errors in pipeline results', async () => {
                const mockPipeline = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        [new Error('Set failed'), null],
                        [null, 'value'],
                    ]),
                };
                mockRedis.pipeline.mockReturnValue(mockPipeline as any);

                const commands = [
                    { command: 'set', args: ['key1', 'value1'] },
                    { command: 'get', args: ['key2'] },
                ];

                await expect(service.pipeline(commands)).rejects.toThrow(
                    'Set failed',
                );
            });
        });

        describe('multi', () => {
            it('should create and execute a transaction', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        ['OK', null],
                        [null, '"value"'],
                    ]),
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                const result = await service.multi((multi) => {
                    multi.set('key1', 'value1');
                    multi.get('key2');
                });

                expect(mockRedis.multi).toHaveBeenCalled();
                expect(mockMulti.exec).toHaveBeenCalled();
                expect(result).toEqual([
                    ['OK', null],
                    [null, '"value"'],
                ]);
            });

            it('should handle transaction execution errors', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    exec: jest
                        .fn()
                        .mockRejectedValue(new Error('Transaction failed')),
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                await expect(
                    service.multi((multi) => {
                        multi.set('key', 'value');
                    }),
                ).rejects.toThrow('Transaction failed');
            });

            it('should handle errors thrown by transaction commands function (line 1240)', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([]), // First exec call succeeds
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                // Test when the commands function itself throws an error - covers line 1240
                await expect(
                    service.multi((_multi) => {
                        throw new Error('Commands function failed');
                    }),
                ).rejects.toThrow('Commands function failed');
            });

            it('should execute commands array in transaction', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        ['OK', null],
                        [null, '"value"'],
                    ]),
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                const commands = [
                    { command: 'set', args: ['key1', 'value1'] },
                    { command: 'get', args: ['key2'] },
                ];

                const result = await service.multi(commands);

                expect(mockRedis.multi).toHaveBeenCalled();
                expect(mockMulti.set).toHaveBeenCalledWith('key1', 'value1');
                expect(mockMulti.get).toHaveBeenCalledWith('key2');
                expect(result).toEqual([
                    ['OK', null],
                    [null, '"value"'],
                ]);
            });

            it('should throw error for empty commands array', async () => {
                await expect(service.multi([])).rejects.toThrow(
                    'Commands must be a non-empty array',
                );
            });

            it('should throw error for invalid command type', async () => {
                const commands = [{ command: 123 as any, args: [] }];
                const mockMulti = { exec: jest.fn() };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                await expect(service.multi(commands)).rejects.toThrow(
                    'Command must be a string',
                );
            });

            it('should throw error for invalid args type', async () => {
                const commands = [{ command: 'set', args: 'not-array' as any }];
                const mockMulti = { exec: jest.fn() };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                await expect(service.multi(commands)).rejects.toThrow(
                    'Args must be an array',
                );
            });

            it('should handle discarded transaction', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue(null),
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                const commands = [{ command: 'set', args: ['key', 'value'] }];
                await expect(service.multi(commands)).rejects.toThrow(
                    'Transaction was discarded',
                );
            });

            it('should handle multi execution errors', async () => {
                const error = new Error('Multi failed');
                mockRedis.multi.mockImplementation(() => {
                    throw error;
                });

                const commands = [{ command: 'set', args: ['key', 'value'] }];
                await expect(service.multi(commands)).rejects.toThrow(
                    'Multi failed',
                );
            });

            it('should handle individual command errors in transaction results', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        [new Error('Set failed'), null],
                        [null, 'value'],
                    ]),
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                const commands = [
                    { command: 'set', args: ['key1', 'value1'] },
                    { command: 'get', args: ['key2'] },
                ];

                await expect(service.multi(commands)).rejects.toThrow(
                    'Set failed',
                );
            });

            it('should execute successful transaction with array commands', async () => {
                const mockMulti = {
                    set: jest.fn().mockReturnThis(),
                    get: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue([
                        [null, 'OK'],
                        [null, '"value"'],
                    ]),
                };
                mockRedis.multi.mockReturnValue(mockMulti as any);

                const commands = [
                    { command: 'set', args: ['key1', 'value1'] },
                    { command: 'get', args: ['key2'] },
                ];

                const result = await service.multi(commands);

                expect(mockMulti.set).toHaveBeenCalledWith('key1', 'value1');
                expect(mockMulti.get).toHaveBeenCalledWith('key2');
                expect(result).toEqual(['OK', '"value"']);
            });
        });

        describe('evalScript', () => {
            it('should execute Lua script', async () => {
                const script = 'return redis.call("get", KEYS[1])';
                const keys = ['mykey'];
                const args = ['arg1'];

                mockRedis.eval.mockResolvedValue('"result"');

                const result = await service.evalScript(script, keys, args);

                expect(mockRedis.eval).toHaveBeenCalledWith(
                    script,
                    keys.length,
                    ...keys,
                    ...args,
                );
                expect(result).toBe('"result"');
            });

            it('should handle script execution errors', async () => {
                const error = new Error('Script execution failed');
                mockRedis.eval.mockRejectedValue(error);

                await expect(
                    service.evalScript('script', [], []),
                ).rejects.toThrow('Script execution failed');
            });

            it('should throw error for empty script', async () => {
                await expect(service.evalScript('', [], [])).rejects.toThrow(
                    'Script must be a non-empty string',
                );
            });

            it('should throw error for non-array keys', async () => {
                await expect(
                    service.evalScript('script', 'not-array' as any, []),
                ).rejects.toThrow('Keys must be an array');
            });

            it('should throw error for non-array args', async () => {
                await expect(
                    service.evalScript('script', [], 'not-array' as any),
                ).rejects.toThrow('Args must be an array');
            });
        });

        describe('getSet', () => {
            beforeEach(() => {
                mockRedis.getset = jest.fn();
            });

            it('should get and set key with previous value', async () => {
                const oldValue = { id: 1, name: 'old' };
                const newValue = { id: 2, name: 'new' };
                mockRedis.getset.mockResolvedValue(JSON.stringify(oldValue));

                const result = await service.getSet('test-key', newValue);

                expect(mockRedis.getset).toHaveBeenCalledWith(
                    'test-key',
                    JSON.stringify(newValue),
                );
                expect(result).toEqual(oldValue);
            });

            it('should return null if no previous value', async () => {
                const newValue = { id: 1, name: 'value' };
                mockRedis.getset.mockResolvedValue(null);

                const result = await service.getSet('test-key', newValue);

                expect(mockRedis.getset).toHaveBeenCalledWith(
                    'test-key',
                    JSON.stringify(newValue),
                );
                expect(result).toBeNull();
            });

            it('should return raw value if JSON parsing fails', async () => {
                const newValue = { id: 1 };
                mockRedis.getset.mockResolvedValue('invalid json {');

                const result = await service.getSet('test-key', newValue);

                expect(result).toBe('invalid json {');
            });

            it('should throw error for empty key', async () => {
                await expect(service.getSet('', 'value')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.getset.mockRejectedValue(error);

                await expect(service.getSet('key', 'value')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        describe('setNX', () => {
            it('should set key if it does not exist without TTL', async () => {
                mockRedis.set.mockResolvedValue('OK');
                const result = await service.setNX('test-key', 'value');
                expect(mockRedis.set).toHaveBeenCalledWith(
                    'test-key',
                    '"value"',
                    'NX',
                );
                expect(result).toBe(true);
            });

            it('should set key if it does not exist with TTL', async () => {
                mockRedis.set.mockResolvedValue('OK');
                const result = await service.setNX('test-key', 'value', 60);
                expect(mockRedis.set).toHaveBeenCalledWith(
                    'test-key',
                    '"value"',
                    'EX',
                    60,
                    'NX',
                );
                expect(result).toBe(true);
            });

            it('should return false if key already exists', async () => {
                mockRedis.set.mockResolvedValue(null);
                const result = await service.setNX('test-key', 'value');
                expect(result).toBe(false);
            });

            it('should throw error for empty key', async () => {
                await expect(service.setNX('', 'value')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid TTL', async () => {
                await expect(service.setNX('key', 'value', -1)).rejects.toThrow(
                    'TTL must be a positive number',
                );
                await expect(service.setNX('key', 'value', 0)).rejects.toThrow(
                    'TTL must be a positive number',
                );
            });

            it('should handle Redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.set.mockRejectedValue(error);
                await expect(service.setNX('key', 'value')).rejects.toThrow(
                    'Redis connection failed',
                );
            });
        });

        // Set operations tests
        describe('sAdd', () => {
            it('should add members to set', async () => {
                (service as any).extensions = {
                    sAdd: jest.fn().mockResolvedValue(2),
                } as any;
                const result = await service.sAdd(
                    'test-set',
                    'member1',
                    'member2',
                );
                expect((service as any).extensions.sAdd).toHaveBeenCalledWith(
                    mockRedis,
                    'test-set',
                    'member1',
                    'member2',
                );
                expect(result).toBe(2);
            });
        });

        describe('sRem', () => {
            it('should remove members from set', async () => {
                (service as any).extensions = {
                    sRem: jest.fn().mockResolvedValue(1),
                } as any;
                const result = await service.sRem('test-set', 'member1');
                expect((service as any).extensions.sRem).toHaveBeenCalledWith(
                    mockRedis,
                    'test-set',
                    'member1',
                );
                expect(result).toBe(1);
            });
        });

        describe('sIsMember', () => {
            it('should check if member exists in set', async () => {
                (service as any).extensions = {
                    sIsMember: jest.fn().mockResolvedValue(true),
                } as any;
                const result = await service.sIsMember('test-set', 'member1');
                expect(
                    (service as any).extensions.sIsMember,
                ).toHaveBeenCalledWith(mockRedis, 'test-set', 'member1');
                expect(result).toBe(true);
            });
        });

        describe('sMembers', () => {
            it('should get all members of set', async () => {
                const members = ['member1', 'member2'];
                (service as any).extensions = {
                    sMembers: jest.fn().mockResolvedValue(members),
                } as any;
                const result = await service.sMembers('test-set');
                expect(
                    (service as any).extensions.sMembers,
                ).toHaveBeenCalledWith(mockRedis, 'test-set');
                expect(result).toBe(members);
            });
        });

        describe('sCard', () => {
            it('should get number of members in set', async () => {
                (service as any).extensions = {
                    sCard: jest.fn().mockResolvedValue(3),
                } as any;
                const result = await service.sCard('test-set');
                expect((service as any).extensions.sCard).toHaveBeenCalledWith(
                    mockRedis,
                    'test-set',
                );
                expect(result).toBe(3);
            });
        });

        describe('sRandMember', () => {
            it('should get random members from set', async () => {
                const members = ['member1'];
                (service as any).extensions = {
                    sRandMember: jest.fn().mockResolvedValue(members),
                } as any;
                const result = await service.sRandMember('test-set', 1);
                expect(
                    (service as any).extensions.sRandMember,
                ).toHaveBeenCalledWith(mockRedis, 'test-set', 1);
                expect(result).toBe(members);
            });
        });

        describe('sPop', () => {
            it('should pop random members from set', async () => {
                const members = ['member1'];
                (service as any).extensions = {
                    sPop: jest.fn().mockResolvedValue(members),
                } as any;
                const result = await service.sPop('test-set', 1);
                expect((service as any).extensions.sPop).toHaveBeenCalledWith(
                    mockRedis,
                    'test-set',
                    1,
                );
                expect(result).toBe(members);
            });
        });

        describe('sInter', () => {
            it('should get intersection of sets', async () => {
                const intersection = ['common'];
                (service as any).extensions = {
                    sInter: jest.fn().mockResolvedValue(intersection),
                } as any;
                const result = await service.sInter(['set1', 'set2']);
                expect((service as any).extensions.sInter).toHaveBeenCalledWith(
                    mockRedis,
                    ['set1', 'set2'],
                );
                expect(result).toBe(intersection);
            });
        });

        describe('sUnion', () => {
            it('should get union of sets', async () => {
                const union = ['member1', 'member2', 'member3'];
                (service as any).extensions = {
                    sUnion: jest.fn().mockResolvedValue(union),
                } as any;
                const result = await service.sUnion(['set1', 'set2']);
                expect((service as any).extensions.sUnion).toHaveBeenCalledWith(
                    mockRedis,
                    ['set1', 'set2'],
                );
                expect(result).toBe(union);
            });
        });

        describe('sDiff', () => {
            it('should get difference between sets', async () => {
                const diff = ['unique'];
                (service as any).extensions = {
                    sDiff: jest.fn().mockResolvedValue(diff),
                } as any;
                const result = await service.sDiff(['set1', 'set2']);
                expect((service as any).extensions.sDiff).toHaveBeenCalledWith(
                    mockRedis,
                    ['set1', 'set2'],
                );
                expect(result).toBe(diff);
            });
        });

        // Sorted Set operations tests
        describe('zAdd', () => {
            it('should add members to sorted set', async () => {
                (service as any).extensions = {
                    zAdd: jest.fn().mockResolvedValue(2),
                } as any;
                const result = await service.zAdd(
                    'test-zset',
                    { score: 1, member: 'member1' },
                    { score: 2, member: 'member2' },
                );
                expect((service as any).extensions.zAdd).toHaveBeenCalledWith(
                    mockRedis,
                    'test-zset',
                    { score: 1, member: 'member1' },
                    { score: 2, member: 'member2' },
                );
                expect(result).toBe(2);
            });
        });

        describe('zRem', () => {
            it('should remove members from sorted set', async () => {
                (service as any).extensions = {
                    zRem: jest.fn().mockResolvedValue(1),
                } as any;
                const result = await service.zRem('test-zset', 'member1');
                expect((service as any).extensions.zRem).toHaveBeenCalledWith(
                    mockRedis,
                    'test-zset',
                    'member1',
                );
                expect(result).toBe(1);
            });
        });

        describe('zRange', () => {
            it('should get range of members from sorted set', async () => {
                const members = ['member1', 'member2'];
                (service as any).extensions = {
                    zRange: jest.fn().mockResolvedValue(members),
                } as any;
                const result = await service.zRange('test-zset', 0, -1, false);
                expect((service as any).extensions.zRange).toHaveBeenCalledWith(
                    mockRedis,
                    'test-zset',
                    0,
                    -1,
                    false,
                );
                expect(result).toBe(members);
            });
        });

        describe('zRangeByScore', () => {
            it('should get range by score from sorted set', async () => {
                const members = ['member1'];
                (service as any).extensions = {
                    zRangeByScore: jest.fn().mockResolvedValue(members),
                } as any;
                const result = await service.zRangeByScore(
                    'test-zset',
                    1,
                    10,
                    false,
                );
                expect(
                    (service as any).extensions.zRangeByScore,
                ).toHaveBeenCalledWith(mockRedis, 'test-zset', 1, 10, false);
                expect(result).toBe(members);
            });
        });

        describe('zRank', () => {
            it('should get rank of member in sorted set', async () => {
                mockRedis.zrank.mockResolvedValue(0);
                const result = await service.zRank('test-zset', 'member1');
                expect(mockRedis.zrank).toHaveBeenCalledWith(
                    'test-zset',
                    '"member1"',
                );
                expect(result).toBe(0);
            });

            it('should return null for non-existent member', async () => {
                mockRedis.zrank.mockResolvedValue(null);
                const result = await service.zRank('test-zset', 'nonexistent');
                expect(result).toBeNull();
            });

            it('should throw error for invalid key', async () => {
                await expect(service.zRank('', 'member1')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.zrank.mockRejectedValue(error);

                await expect(
                    service.zRank('test-zset', 'member1'),
                ).rejects.toThrow(error);
            });
        });

        describe('zScore', () => {
            it('should get score of member in sorted set', async () => {
                mockRedis.zscore.mockResolvedValue('10.5');
                const result = await service.zScore('test-zset', 'member1');
                expect(mockRedis.zscore).toHaveBeenCalledWith(
                    'test-zset',
                    '"member1"',
                );
                expect(result).toBe(10.5);
            });

            it('should return null for non-existent member', async () => {
                mockRedis.zscore.mockResolvedValue(null);
                const result = await service.zScore('test-zset', 'nonexistent');
                expect(result).toBeNull();
            });

            it('should throw error for invalid key', async () => {
                await expect(service.zScore('', 'member1')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.zscore.mockRejectedValue(error);

                await expect(
                    service.zScore('test-zset', 'member1'),
                ).rejects.toThrow(error);
            });
        });

        describe('zCard', () => {
            it('should get cardinality of sorted set', async () => {
                mockRedis.zcard.mockResolvedValue(5);
                const result = await service.zCard('test-zset');
                expect(mockRedis.zcard).toHaveBeenCalledWith('test-zset');
                expect(result).toBe(5);
            });

            it('should throw error for invalid key', async () => {
                await expect(service.zCard('')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.zcard.mockRejectedValue(error);

                await expect(service.zCard('test-zset')).rejects.toThrow(error);
            });
        });

        describe('zCount', () => {
            it('should count members in score range', async () => {
                mockRedis.zcount.mockResolvedValue(3);
                const result = await service.zCount('test-zset', 1, 10);
                expect(mockRedis.zcount).toHaveBeenCalledWith(
                    'test-zset',
                    1,
                    10,
                );
                expect(result).toBe(3);
            });

            it('should work with string range values', async () => {
                mockRedis.zcount.mockResolvedValue(2);
                const result = await service.zCount(
                    'test-zset',
                    '-inf',
                    '+inf',
                );
                expect(mockRedis.zcount).toHaveBeenCalledWith(
                    'test-zset',
                    '-inf',
                    '+inf',
                );
                expect(result).toBe(2);
            });

            it('should throw error for invalid key', async () => {
                await expect(service.zCount('', 1, 10)).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should handle redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.zcount.mockRejectedValue(error);

                await expect(
                    service.zCount('test-zset', 1, 10),
                ).rejects.toThrow(error);
            });
        });

        describe('zIncrBy', () => {
            it('should increment score of member', async () => {
                mockRedis.zincrby.mockResolvedValue('15.5');
                const result = await service.zIncrBy(
                    'test-zset',
                    5.5,
                    'member1',
                );
                expect(mockRedis.zincrby).toHaveBeenCalledWith(
                    'test-zset',
                    5.5,
                    '"member1"',
                );
                expect(result).toBe(15.5);
            });

            it('should throw error for invalid key', async () => {
                await expect(service.zIncrBy('', 1, 'member1')).rejects.toThrow(
                    'Key must be a non-empty string',
                );
            });

            it('should throw error for invalid increment', async () => {
                await expect(
                    service.zIncrBy('test-zset', 'invalid' as any, 'member1'),
                ).rejects.toThrow('Increment must be a number');
            });

            it('should handle redis errors', async () => {
                const error = new Error('Redis connection failed');
                mockRedis.zincrby.mockRejectedValue(error);

                await expect(
                    service.zIncrBy('test-zset', 5.5, 'member1'),
                ).rejects.toThrow(error);
            });
        });
    });

    describe('Uncovered branches targeting in-memory and edge paths', () => {
        it('get should throw when memory fallback contains invalid JSON (covers mem parse error)', async () => {
            const key = 'mem-bad-json';
            // Force Redis to return null so fallback to memory occurs
            mockRedis.get.mockResolvedValue(null as any);
            // Write invalid JSON into private memory store
            (service as any)['memoryStore'].set(key, {
                value: 'invalid json {',
                expiresAt: null,
            });

            await expect(service.get(key)).rejects.toThrow(
                `Failed to parse value for key: ${key}`,
            );
        });

        it('hasKey should delete expired memory entry and return false (covers expired cleanup path)', async () => {
            const key = 'expired-key';
            // Insert expired entry
            (service as any)['memoryStore'].set(key, {
                value: '"v"',
                expiresAt: Date.now() - 1000,
            });
            mockRedis.exists.mockResolvedValue(0 as any);

            const result = await service.hasKey(key);
            expect(result).toBe(false);
            expect((service as any)['memoryStore'].has(key)).toBe(false);
        });

        it('ttl should return -1 for in-memory value without TTL (covers -1 branch)', async () => {
            const key = 'no-ttl';
            (service as any)['memoryStore'].set(key, {
                value: '"v"',
                expiresAt: null,
            });

            const ttl = await service.ttl(key);
            expect(ttl).toBe(-1);
        });

        it('expire should update in-memory TTL metadata when Redis ack is 1 (covers mem update path)', async () => {
            const key = 'update-ttl';
            // Seed memory store as if previously set
            (service as any)['memoryStore'].set(key, {
                value: '"v"',
                expiresAt: null,
            });
            mockRedis.expire.mockResolvedValue(1 as any);

            const ttlSeconds = 60;
            const before = Date.now();
            const ok = await service.expire(key, ttlSeconds);
            const after = Date.now();

            expect(ok).toBe(true);
            const mem = (service as any)['memoryStore'].get(key);
            expect(mem).toBeDefined();
            // expiresAt should be between before+ttl and after+ttl (allowing small clock drift)
            expect(mem.expiresAt).toBeGreaterThanOrEqual(
                before + ttlSeconds * 1000,
            );
            expect(mem.expiresAt).toBeLessThanOrEqual(
                after + ttlSeconds * 1000 + 10,
            );
        });
    });
});
