import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisExtensionsService } from './redis-extensions.service';

describe('RedisExtensionsService', () => {
  let service: RedisExtensionsService;
  let mockRedis: jest.Mocked<Redis>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Create a mock Redis instance
    mockRedis = {
      sadd: jest.fn(),
      srem: jest.fn(),
      sismember: jest.fn(),
      smembers: jest.fn(),
      scard: jest.fn(),
      srandmember: jest.fn(),
      spop: jest.fn(),
      sinter: jest.fn(),
      sunion: jest.fn(),
      sdiff: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrange: jest.fn(),
      zrangebyscore: jest.fn(),
      scan: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisExtensionsService],
    }).compile();

    service = module.get<RedisExtensionsService>(RedisExtensionsService);
    
    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Set Operations', () => {
    describe('sAdd', () => {
      it('should add members to a set successfully', async () => {
        const key = 'test-set';
        const members = ['member1', 'member2', { id: 1 }];
        mockRedis.sadd.mockResolvedValue(2);

        const result = await service.sAdd(mockRedis, key, ...members);

        expect(result).toBe(2);
        expect(mockRedis.sadd).toHaveBeenCalledWith(
          key,
          '"member1"',
          '"member2"',
          '{"id":1}'
        );
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Adding members to set: test-set - 3 members')
        );
      });

      it('should throw error for empty key', async () => {
        await expect(service.sAdd(mockRedis, '', 'member')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });

      it('should throw error for no members', async () => {
        await expect(service.sAdd(mockRedis, 'key')).rejects.toThrow(
          'At least one member must be provided'
        );
      });

      it('should handle Redis errors', async () => {
        const error = new Error('Redis error');
        mockRedis.sadd.mockRejectedValue(error);

        await expect(service.sAdd(mockRedis, 'key', 'member')).rejects.toThrow(error);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Adding members to set: key - 1 members')
        );
      });
    });

    describe('sRem', () => {
      it('should remove members from a set successfully', async () => {
        const key = 'test-set';
        const members = ['member1', 'member2'];
        mockRedis.srem.mockResolvedValue(1);

        const result = await service.sRem(mockRedis, key, ...members);

        expect(result).toBe(1);
        expect(mockRedis.srem).toHaveBeenCalledWith(key, '"member1"', '"member2"');
      });

      it('should throw error for empty key', async () => {
        await expect(service.sRem(mockRedis, '', 'member')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });

      it('should throw error for no members', async () => {
        await expect(service.sRem(mockRedis, 'key')).rejects.toThrow(
          'At least one member must be provided'
        );
      });
    });

    describe('sIsMember', () => {
      it('should check if member exists in set', async () => {
        const key = 'test-set';
        const member = 'test-member';
        mockRedis.sismember.mockResolvedValue(1);

        const result = await service.sIsMember(mockRedis, key, member);

        expect(result).toBe(true);
        expect(mockRedis.sismember).toHaveBeenCalledWith(key, '"test-member"');
      });

      it('should return false when member does not exist', async () => {
        mockRedis.sismember.mockResolvedValue(0);

        const result = await service.sIsMember(mockRedis, 'key', 'member');

        expect(result).toBe(false);
      });

      it('should throw error for empty key', async () => {
        await expect(service.sIsMember(mockRedis, '', 'member')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });
    });

    describe('sMembers', () => {
      it('should get all members of a set', async () => {
        const key = 'test-set';
        const members = ['"member1"', '"member2"', '{"id":1}'];
        mockRedis.smembers.mockResolvedValue(members);

        const result = await service.sMembers(mockRedis, key);

        expect(result).toEqual(['member1', 'member2', { id: 1 }]);
        expect(mockRedis.smembers).toHaveBeenCalledWith(key);
      });

      it('should handle parse errors gracefully', async () => {
        const members = ['"valid"', 'invalid-json'];
        mockRedis.smembers.mockResolvedValue(members);

        const result = await service.sMembers(mockRedis, 'key');

        expect(result).toEqual(['valid', 'invalid-json']);
      });

      it('should throw error for empty key', async () => {
        await expect(service.sMembers(mockRedis, '')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });
    });

    describe('sCard', () => {
      it('should get the cardinality of a set', async () => {
        const key = 'test-set';
        mockRedis.scard.mockResolvedValue(5);

        const result = await service.sCard(mockRedis, key);

        expect(result).toBe(5);
        expect(mockRedis.scard).toHaveBeenCalledWith(key);
      });

      it('should throw error for empty key', async () => {
        await expect(service.sCard(mockRedis, '')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });
    });

    describe('sRandMember', () => {
      it('should get random members without count', async () => {
        const key = 'test-set';
        mockRedis.srandmember.mockResolvedValue('"member1"');

        const result = await service.sRandMember(mockRedis, key);

        expect(result).toEqual(['member1']);
        expect(mockRedis.srandmember).toHaveBeenCalledWith(key);
      });

      it('should get random members with count', async () => {
        const key = 'test-set';
        const count = 2;
        mockRedis.srandmember.mockResolvedValue(['"member1"', '"member2"']);

        const result = await service.sRandMember(mockRedis, key, count);

        expect(result).toEqual(['member1', 'member2']);
        expect(mockRedis.srandmember).toHaveBeenCalledWith(key, count);
      });

      it('should handle array with null values', async () => {
        const key = 'test-set';
        const count = 3;
        mockRedis.srandmember.mockResolvedValue(['"member1"', null, '"member2"']);

        const result = await service.sRandMember(mockRedis, key, count);

        expect(result).toEqual(['member1', null, 'member2']);
      });

      it('should handle null values', async () => {
        mockRedis.srandmember.mockResolvedValue(null);

        const result = await service.sRandMember(mockRedis, 'key');

        expect(result).toEqual([]);
      });

      it('should handle parse errors', async () => {
        mockRedis.srandmember.mockResolvedValue(['invalid-json']);

        const result = await service.sRandMember(mockRedis, 'key', 1);

        expect(result).toEqual(['invalid-json']);
      });

      it('should throw error for empty key', async () => {
        await expect(service.sRandMember(mockRedis, '')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });
    });

    describe('sPop', () => {
      it('should pop random members without count', async () => {
        const key = 'test-set';
        mockRedis.spop.mockResolvedValue('"member1"');

        const result = await service.sPop(mockRedis, key);

        expect(result).toEqual(['member1']);
        expect(mockRedis.spop).toHaveBeenCalledWith(key);
      });

      it('should pop random members with count', async () => {
        const key = 'test-set';
        const count = 2;
        mockRedis.spop.mockResolvedValue(['"member1"', '"member2"']);

        const result = await service.sPop(mockRedis, key, count);

        expect(result).toEqual(['member1', 'member2']);
        expect(mockRedis.spop).toHaveBeenCalledWith(key, count);
      });

      it('should handle array with null values', async () => {
        const key = 'test-set';
        const count = 3;
        mockRedis.spop.mockResolvedValue(['"member1"', null, '"member2"']);

        const result = await service.sPop(mockRedis, key, count);

        expect(result).toEqual(['member1', null, 'member2']);
      });

      it('should handle null values', async () => {
        mockRedis.spop.mockResolvedValue(null);

        const result = await service.sPop(mockRedis, 'key');

        expect(result).toEqual([]);
      });

      it('should handle parse errors in pop with count', async () => {
        mockRedis.spop.mockResolvedValue(['invalid-json', '"valid"']);

        const result = await service.sPop(mockRedis, 'key', 2);

        expect(result).toEqual(['invalid-json', 'valid']);
      });

      it('should throw error for empty key', async () => {
        await expect(service.sPop(mockRedis, '')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });
    });

    describe('sInter', () => {
      it('should get intersection of multiple sets', async () => {
        const keys = ['set1', 'set2'];
        const members = ['"member1"', '"member2"'];
        mockRedis.sinter.mockResolvedValue(members);

        const result = await service.sInter(mockRedis, keys);

        expect(result).toEqual(['member1', 'member2']);
        expect(mockRedis.sinter).toHaveBeenCalledWith(...keys);
      });

      it('should throw error for empty keys array', async () => {
        await expect(service.sInter(mockRedis, [])).rejects.toThrow(
          'Keys must be a non-empty array'
        );
      });

      it('should throw error for non-array keys', async () => {
        await expect(service.sInter(mockRedis, 'not-array' as any)).rejects.toThrow(
          'Keys must be a non-empty array'
        );
      });

      it('should throw error for keys containing empty string', async () => {
        await expect(service.sInter(mockRedis, ['key1', ''])).rejects.toThrow(
          'All keys must be non-empty strings'
        );
      });

      it('should handle parse errors gracefully', async () => {
        const keys = ['set1', 'set2'];
        const members = ['invalid-json', '"member2"'];
        mockRedis.sinter.mockResolvedValue(members);

        const result = await service.sInter(mockRedis, keys);

        expect(result).toEqual(['invalid-json', 'member2']);
      });
    });

    describe('sUnion', () => {
      it('should get union of multiple sets', async () => {
        const keys = ['set1', 'set2'];
        const members = ['"member1"', '"member2"', '"member3"'];
        mockRedis.sunion.mockResolvedValue(members);

        const result = await service.sUnion(mockRedis, keys);

        expect(result).toEqual(['member1', 'member2', 'member3']);
        expect(mockRedis.sunion).toHaveBeenCalledWith(...keys);
      });

      it('should throw error for empty keys array', async () => {
        await expect(service.sUnion(mockRedis, [])).rejects.toThrow(
          'Keys must be a non-empty array'
        );
      });

      it('should throw error for keys containing empty string', async () => {
        await expect(service.sUnion(mockRedis, ['key1', ''])).rejects.toThrow(
          'All keys must be non-empty strings'
        );
      });

      it('should handle parse errors gracefully', async () => {
        const keys = ['set1', 'set2'];
        const members = ['invalid-json', '"member2"', '"member3"'];
        mockRedis.sunion.mockResolvedValue(members);

        const result = await service.sUnion(mockRedis, keys);

        expect(result).toEqual(['invalid-json', 'member2', 'member3']);
      });
    });

    describe('sDiff', () => {
      it('should get difference between sets', async () => {
        const keys = ['set1', 'set2'];
        const members = ['"member1"'];
        mockRedis.sdiff.mockResolvedValue(members);

        const result = await service.sDiff(mockRedis, keys);

        expect(result).toEqual(['member1']);
        expect(mockRedis.sdiff).toHaveBeenCalledWith(...keys);
      });

      it('should throw error for empty keys array', async () => {
        await expect(service.sDiff(mockRedis, [])).rejects.toThrow(
          'Keys must be a non-empty array'
        );
      });

      it('should throw error for keys containing empty string', async () => {
        await expect(service.sDiff(mockRedis, ['key1', ''])).rejects.toThrow(
          'All keys must be non-empty strings'
        );
      });

      it('should handle parse errors gracefully', async () => {
        const keys = ['set1', 'set2'];
        const members = ['invalid-json'];
        mockRedis.sdiff.mockResolvedValue(members);

        const result = await service.sDiff(mockRedis, keys);

        expect(result).toEqual(['invalid-json']);
      });
    });
  });

  describe('Sorted Set Operations', () => {
    describe('zAdd', () => {
      it('should add members to sorted set with scores', async () => {
        const key = 'test-zset';
        const scoreMembers = [
          { score: 1.5, member: 'member1' },
          { score: 2.0, member: { id: 1 } }
        ];
        mockRedis.zadd = jest.fn().mockResolvedValue(2);

        const result = await service.zAdd(mockRedis, key, ...scoreMembers);

        expect(result).toBe(2);
        expect(mockRedis.zadd).toHaveBeenCalledWith(
          key,
          1.5,
          '"member1"',
          2.0,
          '{"id":1}'
        );
      });

      it('should throw error for empty key', async () => {
        await expect(service.zAdd(mockRedis, '', { score: 1, member: 'test' })).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });

      it('should throw error for no score-member pairs', async () => {
        await expect(service.zAdd(mockRedis, 'key')).rejects.toThrow(
          'At least one score-member pair must be provided'
        );
      });

      it('should throw error for invalid score', async () => {
        await expect(
          service.zAdd(mockRedis, 'key', { score: 'invalid' as any, member: 'test' })
        ).rejects.toThrow('Score must be a number');
      });
    });

    describe('zRem', () => {
      it('should remove members from sorted set', async () => {
        const key = 'test-zset';
        const members = ['member1', 'member2'];
        mockRedis.zrem.mockResolvedValue(1);

        const result = await service.zRem(mockRedis, key, ...members);

        expect(result).toBe(1);
        expect(mockRedis.zrem).toHaveBeenCalledWith(key, '"member1"', '"member2"');
      });

      it('should throw error for empty key', async () => {
        await expect(service.zRem(mockRedis, '', 'member')).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });

      it('should throw error for no members', async () => {
        await expect(service.zRem(mockRedis, 'key')).rejects.toThrow(
          'At least one member must be provided'
        );
      });
    });

    describe('zRange', () => {
      it('should get range without scores', async () => {
        const key = 'test-zset';
        const members = ['"member1"', '"member2"'];
        mockRedis.zrange.mockResolvedValue(members);

        const result = await service.zRange(mockRedis, key, 0, -1, false);

        expect(result).toEqual(['member1', 'member2']);
        expect(mockRedis.zrange).toHaveBeenCalledWith(key, 0, -1);
      });

      it('should get range with scores', async () => {
        const key = 'test-zset';
        const result_with_scores = ['"member1"', '1.5', '"member2"', '2.0'];
        mockRedis.zrange.mockResolvedValue(result_with_scores);

        const result = await service.zRange(mockRedis, key, 0, -1, true);

        expect(result).toEqual([
          { member: 'member1', score: 1.5 },
          { member: 'member2', score: 2.0 }
        ]);
        expect(mockRedis.zrange).toHaveBeenCalledWith(key, 0, -1, 'WITHSCORES');
      });

      it('should handle parse errors in range with scores', async () => {
        const result_with_scores = ['invalid-json', '1.5'];
        mockRedis.zrange.mockResolvedValue(result_with_scores);

        const result = await service.zRange(mockRedis, 'key', 0, -1, true);

        expect(result).toEqual([{ member: 'invalid-json', score: 1.5 }]);
      });

      it('should handle parse errors in range without scores', async () => {
        const members = ['invalid-json', '"valid"'];
        mockRedis.zrange.mockResolvedValue(members);

        const result = await service.zRange(mockRedis, 'key', 0, -1, false);

        expect(result).toEqual(['invalid-json', 'valid']);
      });

      it('should throw error for empty key', async () => {
        await expect(service.zRange(mockRedis, '', 0, -1)).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });

      it('should throw error for invalid start/stop', async () => {
        await expect(service.zRange(mockRedis, 'key', 'invalid' as any, -1)).rejects.toThrow(
          'Start and stop must be numbers'
        );
      });
    });

    describe('zRangeByScore', () => {
      it('should get range by score without scores', async () => {
        const key = 'test-zset';
        const members = ['"member1"', '"member2"'];
        mockRedis.zrangebyscore.mockResolvedValue(members);

        const result = await service.zRangeByScore(mockRedis, key, 1, 5, false);

        expect(result).toEqual(['member1', 'member2']);
        expect(mockRedis.zrangebyscore).toHaveBeenCalledWith(key, 1, 5);
      });

      it('should get range by score with scores', async () => {
        const key = 'test-zset';
        const result_with_scores = ['"member1"', '1.5', '"member2"', '2.0'];
        mockRedis.zrangebyscore.mockResolvedValue(result_with_scores);

        const result = await service.zRangeByScore(mockRedis, key, 1, 5, true);

        expect(result).toEqual([
          { member: 'member1', score: 1.5 },
          { member: 'member2', score: 2.0 }
        ]);
        expect(mockRedis.zrangebyscore).toHaveBeenCalledWith(key, 1, 5, 'WITHSCORES');
      });

      it('should handle parse errors in range by score with scores', async () => {
        const key = 'test-zset';
        const result_with_scores = ['invalid-json', '1.5', '"member2"', '2.0'];
        mockRedis.zrangebyscore.mockResolvedValue(result_with_scores);

        const result = await service.zRangeByScore(mockRedis, key, 1, 5, true);

        expect(result).toEqual([
          { member: 'invalid-json', score: 1.5 },
          { member: 'member2', score: 2.0 }
        ]);
      });

      it('should handle string score ranges', async () => {
        const members = ['"member1"'];
        mockRedis.zrangebyscore.mockResolvedValue(members);

        const result = await service.zRangeByScore(mockRedis, 'key', '-inf', '+inf');

        expect(result).toEqual(['member1']);
        expect(mockRedis.zrangebyscore).toHaveBeenCalledWith('key', '-inf', '+inf');
      });

      it('should handle parse errors in range by score without scores', async () => {
        const members = ['invalid-json', '"valid"'];
        mockRedis.zrangebyscore.mockResolvedValue(members);

        const result = await service.zRangeByScore(mockRedis, 'key', 1, 5, false);

        expect(result).toEqual(['invalid-json', 'valid']);
      });

      it('should throw error for empty key', async () => {
        await expect(service.zRangeByScore(mockRedis, '', 1, 5)).rejects.toThrow(
          'Key must be a non-empty string'
        );
      });
    });
  });

  describe('Advanced Operations', () => {
    describe('scan', () => {
      it('should scan keys with cursor only', async () => {
        const cursor = '0';
        mockRedis.scan.mockResolvedValue(['10', ['key1', 'key2']]);

        const result = await service.scan(mockRedis, cursor);

        expect(result).toEqual({ cursor: '10', keys: ['key1', 'key2'] });
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor);
      });

      it('should scan keys with pattern and count', async () => {
        const cursor = '0';
        const pattern = 'user:*';
        const count = 100;
        mockRedis.scan.mockResolvedValue(['0', ['user:1', 'user:2']]);

        const result = await service.scan(mockRedis, cursor, pattern, count);

        expect(result).toEqual({ cursor: '0', keys: ['user:1', 'user:2'] });
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor, 'MATCH', pattern, 'COUNT', count);
      });

      it('should scan keys with pattern only', async () => {
        const cursor = '0';
        const pattern = 'test:*';
        mockRedis.scan.mockResolvedValue(['0', ['test:1']]);

        const result = await service.scan(mockRedis, cursor, pattern);

        expect(result).toEqual({ cursor: '0', keys: ['test:1'] });
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor, 'MATCH', pattern);
      });

      it('should scan keys with count only', async () => {
        const cursor = '0';
        const count = 50;
        mockRedis.scan.mockResolvedValue(['0', ['key1']]);

        const result = await service.scan(mockRedis, cursor, undefined, count);

        expect(result).toEqual({ cursor: '0', keys: ['key1'] });
        expect(mockRedis.scan).toHaveBeenCalledWith(cursor, 'COUNT', count);
      });
    });

    describe('mGet', () => {
      it('should get multiple keys successfully', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const values = ['"value1"', '"value2"', null];
        mockRedis.mget.mockResolvedValue(values);

        const result = await service.mGet(mockRedis, keys);

        expect(result).toEqual(['value1', 'value2', null]);
        expect(mockRedis.mget).toHaveBeenCalledWith(...keys);
      });

      it('should handle parse errors gracefully', async () => {
        const keys = ['key1', 'key2'];
        const values = ['"valid"', 'invalid-json'];
        mockRedis.mget.mockResolvedValue(values);

        const result = await service.mGet(mockRedis, keys);

        expect(result).toEqual(['valid', 'invalid-json']);
      });

      it('should throw error for empty keys array', async () => {
        await expect(service.mGet(mockRedis, [])).rejects.toThrow(
          'Keys must be a non-empty array'
        );
      });

      it('should throw error for non-array keys', async () => {
        await expect(service.mGet(mockRedis, 'not-array' as any)).rejects.toThrow(
          'Keys must be a non-empty array'
        );
      });
    });

    describe('mSet', () => {
      it('should set multiple keys successfully', async () => {
        const keyValues = { key1: 'value1', key2: { id: 1 }, key3: 123 };
        mockRedis.mset.mockResolvedValue('OK');

        await service.mSet(mockRedis, keyValues);

        expect(mockRedis.mset).toHaveBeenCalledWith(
          'key1', '"value1"',
          'key2', '{"id":1}',
          'key3', '123'
        );
      });

      it('should throw error for null keyValues', async () => {
        await expect(service.mSet(mockRedis, null as any)).rejects.toThrow(
          'KeyValues must be an object'
        );
      });

      it('should throw error for non-object keyValues', async () => {
        await expect(service.mSet(mockRedis, 'not-object' as any)).rejects.toThrow(
          'KeyValues must be an object'
        );
      });

      it('should throw error for empty keyValues', async () => {
        await expect(service.mSet(mockRedis, {})).rejects.toThrow(
          'At least one key-value pair must be provided'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should log errors with timing information', async () => {
      const error = new Error('Redis connection error');
      mockRedis.scard.mockRejectedValue(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.sCard(mockRedis, 'test-key')).rejects.toThrow(error);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to get set cardinality: test-key after \d+ms/),
        error
      );
    });

    it('should log timing information for successful operations', async () => {
      mockRedis.scard.mockResolvedValue(5);

      await service.sCard(mockRedis, 'test-key');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Getting set cardinality: test-key/)
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Set cardinality: test-key - 5 members \(\d+ms\)/)
      );
    });

    it('should handle sRem error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.srem.mockRejectedValue(error);

      await expect(service.sRem(mockRedis, 'test-key', 'member')).rejects.toThrow(error);
    });

    it('should handle sIsMember error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.sismember.mockRejectedValue(error);

      await expect(service.sIsMember(mockRedis, 'test-key', 'member')).rejects.toThrow(error);
    });

    it('should handle sMembers error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.smembers.mockRejectedValue(error);

      await expect(service.sMembers(mockRedis, 'test-key')).rejects.toThrow(error);
    });

    it('should handle sRandMember error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.srandmember.mockRejectedValue(error);

      await expect(service.sRandMember(mockRedis, 'test-key')).rejects.toThrow(error);
    });

    it('should handle sPop error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.spop.mockRejectedValue(error);

      await expect(service.sPop(mockRedis, 'test-key')).rejects.toThrow(error);
    });

    it('should handle sInter error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.sinter.mockRejectedValue(error);

      await expect(service.sInter(mockRedis, ['key1', 'key2'])).rejects.toThrow(error);
    });

    it('should handle sUnion error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.sunion.mockRejectedValue(error);

      await expect(service.sUnion(mockRedis, ['key1', 'key2'])).rejects.toThrow(error);
    });

    it('should handle sDiff error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.sdiff.mockRejectedValue(error);

      await expect(service.sDiff(mockRedis, ['key1', 'key2'])).rejects.toThrow(error);
    });

    it('should handle zRem error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.zrem.mockRejectedValue(error);

      await expect(service.zRem(mockRedis, 'test-key', 'member')).rejects.toThrow(error);
    });

    it('should handle zRange error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.zrange.mockRejectedValue(error);

      await expect(service.zRange(mockRedis, 'test-key', 0, -1)).rejects.toThrow(error);
    });

    it('should handle zRangeByScore error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.zrangebyscore.mockRejectedValue(error);

      await expect(service.zRangeByScore(mockRedis, 'test-key', 1, 5)).rejects.toThrow(error);
    });

    it('should handle scan error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.scan.mockRejectedValue(error);

      await expect(service.scan(mockRedis, '0')).rejects.toThrow(error);
    });

    it('should handle mGet error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.mget.mockRejectedValue(error);

      await expect(service.mGet(mockRedis, ['key1', 'key2'])).rejects.toThrow(error);
    });

    it('should handle mSet error scenarios', async () => {
      const error = new Error('Redis connection failed');
      mockRedis.mset.mockRejectedValue(error);

      await expect(service.mSet(mockRedis, { key1: 'value1' })).rejects.toThrow(error);
    });
  });
});