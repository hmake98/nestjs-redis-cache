import { Cacheable } from './cacheable.decorator';
import { Logger } from '@nestjs/common';

describe('Cacheable Decorator', () => {
  let mockRedisService: any;
  let testClass: any;

  beforeEach(() => {
    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    // Create a test class with the decorator
    class TestClass {
      redisService = mockRedisService;

      @Cacheable({ key: 'test:key', ttl: 60 })
      async getData() {
        return { data: 'test' };
      }

      @Cacheable({
        key: 'test:key2',
        scope: 'module',
        moduleName: 'TestModule',
      })
      async getDataWithScope() {
        return { data: 'test2' };
      }

      @Cacheable({ key: 'test:key3', ttl: 30, serialize: false })
      async getDataWithOptions() {
        return { data: 'test3' };
      }
    }

    testClass = new TestClass();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cache hit scenarios', () => {
    it('should return cached value when available', async () => {
      const cachedValue = { data: 'cached' };
      mockRedisService.get.mockResolvedValue(cachedValue);

      const result = await testClass.getData();

      expect(mockRedisService.get).toHaveBeenCalledWith('test:key');
      expect(result).toEqual(cachedValue);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should handle null cached value', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await testClass.getData();

      expect(result).toEqual({ data: 'test' });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:key',
        { data: 'test' },
        60,
      );
    });
  });

  describe('cache miss scenarios', () => {
    it('should execute method and cache result', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await testClass.getData();

      expect(result).toEqual({ data: 'test' });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:key',
        { data: 'test' },
        60,
      );
    });

    it('should use default TTL when not specified', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Create a method without TTL
      class TestClassNoTtl {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:key4' })
        async getData() {
          return { data: 'test4' };
        }
      }

      const testInstance = new TestClassNoTtl();
      await testInstance.getData();

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:key4',
        { data: 'test4' },
        300,
      );
    });

    it('should not cache undefined or null results', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassNull {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:null' })
        async getNull() {
          return null;
        }

        @Cacheable({ key: 'test:undefined' })
        async getUndefined() {
          return undefined;
        }
      }

      const testInstance = new TestClassNull();

      await testInstance.getNull();
      await testInstance.getUndefined();

      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should fallback to original method when cache operations fail', async () => {
      const mockMethod = jest.fn().mockResolvedValue('original result');
      const mockRedisService = {
        get: jest.fn().mockRejectedValue(new Error('Redis error')),
        set: jest.fn(),
      };

      const descriptor = {
        value: mockMethod,
      };

      const decoratedMethod = Cacheable({
        key: 'test-key',
        ttl: 300,
      })(testClass, 'testMethod', descriptor);

      const result = await decoratedMethod.value.call(
        { redisService: mockRedisService },
        'arg1',
        'arg2',
      );

      expect(result).toBe('original result');
      expect(mockMethod).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('key generation', () => {
    it('should generate correct keys for different scopes', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await testClass.getData(); // global scope
      await testClass.getDataWithScope(); // module scope

      expect(mockRedisService.get).toHaveBeenCalledWith('test:key');
      expect(mockRedisService.get).toHaveBeenCalledWith('TestModule:test:key2');
    });

    it('should handle complex keys', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassComplex {
        redisService = mockRedisService;

        @Cacheable({ key: 'user:profile:123:settings' })
        async getComplexData() {
          return { settings: 'complex' };
        }
      }

      const testInstance = new TestClassComplex();
      await testInstance.getComplexData();

      expect(mockRedisService.get).toHaveBeenCalledWith(
        'user:profile:123:settings',
      );
    });
  });

  describe('method arguments', () => {
    it('should pass arguments to original method', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassArgs {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:args' })
        async getDataWithArgs(arg1: string, arg2: number) {
          return { arg1, arg2 };
        }
      }

      const testInstance = new TestClassArgs();
      const result = await testInstance.getDataWithArgs('test', 123);

      expect(result).toEqual({ arg1: 'test', arg2: 123 });
    });
  });

  describe('multiple calls', () => {
    it('should cache result on first call and return cached on second', async () => {
      mockRedisService.get
        .mockResolvedValueOnce(null) // First call - cache miss
        .mockResolvedValueOnce({ data: 'cached' }); // Second call - cache hit

      const result1 = await testClass.getData();
      const result2 = await testClass.getData();

      expect(result1).toEqual({ data: 'test' });
      expect(result2).toEqual({ data: 'cached' });
      expect(mockRedisService.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('decorator options', () => {
    it('should handle different TTL values', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassTtl {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:ttl1', ttl: 10 })
        async getData1() {
          return { data: 'test1' };
        }

        @Cacheable({ key: 'test:ttl2', ttl: 3600 })
        async getData2() {
          return { data: 'test2' };
        }
      }

      const testInstance = new TestClassTtl();
      await testInstance.getData1();
      await testInstance.getData2();

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:ttl1',
        { data: 'test1' },
        10,
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:ttl2',
        { data: 'test2' },
        3600,
      );
    });

    it('should handle different scopes', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassScopes {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:global', scope: 'global' })
        async getGlobalData() {
          return { data: 'global' };
        }

        @Cacheable({
          key: 'test:module',
          scope: 'module',
          moduleName: 'TestModule',
        })
        async getModuleData() {
          return { data: 'module' };
        }
      }

      const testInstance = new TestClassScopes();
      await testInstance.getGlobalData();
      await testInstance.getModuleData();

      expect(mockRedisService.get).toHaveBeenCalledWith('test:global');
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'TestModule:test:module',
      );
    });
  });

  describe('coverage for catch block', () => {
    it('should call fallback/original method if redisService.get throws', async () => {
      mockRedisService.get.mockImplementation(() => {
        throw new Error('get error');
      });
      const result = await testClass.getData();
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('module scope without moduleName', () => {
    it('should warn and fallback to global scope, using global key', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const mockMethod = jest.fn().mockResolvedValue('result');
      const mockRedisService = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
      };
      const descriptor = { value: mockMethod };
      const decoratedMethod = Cacheable({ key: 'test-key', scope: 'module' })(
        testClass,
        'testMethod',
        descriptor,
      );
      await decoratedMethod.value.call(
        { redisService: mockRedisService },
        'arg1',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'module scope specified but no moduleName provided',
        ),
      );
      // Should fallback to global key
      expect(mockRedisService.get).toHaveBeenCalledWith('test-key');
      warnSpy.mockRestore();
    });
  });
});
