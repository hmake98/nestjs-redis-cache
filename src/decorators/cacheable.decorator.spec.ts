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

      @Cacheable({ key: 'test:error', ttl: 60 })
      async getDataWithError() {
        throw new Error('Method error');
      }
    }

    testClass = new TestClass();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validation at decorator definition time', () => {
    it('should throw error when options are null', () => {
      expect(() => {
        class TestClass {
          @Cacheable(null as any)
          async testMethod() {}
        }
      }).toThrow('@Cacheable: options are required');
    });

    it('should throw error when options are undefined', () => {
      expect(() => {
        class TestClass {
          @Cacheable(undefined as any)
          async testMethod() {}
        }
      }).toThrow('@Cacheable: options are required');
    });

    it('should throw error when key is missing', () => {
      expect(() => {
        class TestClass {
          @Cacheable({} as any)
          async testMethod() {}
        }
      }).toThrow('@Cacheable: key cannot be empty');
    });

    it('should throw error when key is not a string', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 123 } as any)
          async testMethod() {}
        }
      }).toThrow('@Cacheable: key must be a string');
    });

    it('should throw error when key is empty string', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: '' })
          async testMethod() {}
        }
      }).toThrow('@Cacheable: key cannot be empty');
    });

    it('should throw error when ttl is not a positive number', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', ttl: -1 })
          async testMethod() {}
        }
      }).toThrow('@Cacheable: ttl must be a positive number');
    });

    it('should throw error when ttl is zero', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', ttl: 0 })
          async testMethod() {}
        }
      }).toThrow('@Cacheable: ttl must be a positive number');
    });

    it('should throw error when scope is invalid', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', scope: 'invalid' as any })
          async testMethod() {}
        }
      }).toThrow('@Cacheable: scope must be either "global" or "module"');
    });

    it('should throw error when module scope lacks moduleName', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', scope: 'module' })
          async testMethod() {}
        }
      }).toThrow('@Cacheable: moduleName cannot be empty');
    });

    it('should throw error when moduleName is not a string', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', scope: 'module', moduleName: 123 } as any)
          async testMethod() {}
        }
      }).toThrow('@Cacheable: moduleName must be a string');
    });

    it('should throw error when moduleName is empty string', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', scope: 'module', moduleName: '' })
          async testMethod() {}
        }
      }).toThrow('@Cacheable: moduleName cannot be empty');
    });

    it('should throw error when serialize is not a boolean', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test', serialize: 'true' } as any)
          async testMethod() {}
        }
      }).toThrow('@Cacheable: serialize must be a boolean');
    });

    it('should throw error when applied to non-method', () => {
      expect(() => {
        class TestClass {
          @Cacheable({ key: 'test' })
          property = 'value';
        }
      }).toThrow('@Cacheable can only be applied to methods, but property is not a method');
    });
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

    it('should handle undefined cached value', async () => {
      mockRedisService.get.mockResolvedValue(undefined);

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
        300, // Default TTL
      );
    });

    it('should not cache null results', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassNullResult {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:null' })
        async getData() {
          return null;
        }
      }

      const testInstance = new TestClassNullResult();
      const result = await testInstance.getData();

      expect(result).toBeNull();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should not cache undefined results', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassUndefinedResult {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:undefined' })
        async getData() {
          return undefined;
        }
      }

      const testInstance = new TestClassUndefinedResult();
      const result = await testInstance.getData();

      expect(result).toBeUndefined();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  describe('scoped keys', () => {
    it('should handle module scope with moduleName', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await testClass.getDataWithScope();

      expect(mockRedisService.get).toHaveBeenCalledWith('TestModule:test:key2');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'TestModule:test:key2',
        { data: 'test2' },
        300,
      );
    });

    it('should handle module scope validation at definition time', async () => {
      // This test verifies that validation happens at definition time now
      expect(() => {
        class TestClassInvalidScope {
          redisService = mockRedisService;

          @Cacheable({ key: 'test', scope: 'module' } as any)
          async getData() {
            return { data: 'fallback' };
          }
        }
      }).toThrow('@Cacheable: moduleName cannot be empty');
    });
  });

  describe('RedisService availability', () => {
    it('should fallback to original method when RedisService is not available', async () => {
      class TestClassNoRedis {
        redisService = null;

        @Cacheable({ key: 'test:no-redis' })
        async getData() {
          return { data: 'no-redis' };
        }
      }

      const testInstance = new TestClassNoRedis();
      
      // Mock the logger to suppress warning output during test
      jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const result = await testInstance.getData();

      expect(result).toEqual({ data: 'no-redis' });
    });

    it('should fallback to original method when RedisService is undefined', async () => {
      class TestClassUndefinedRedis {
        @Cacheable({ key: 'test:undefined-redis' })
        async getData() {
          return { data: 'undefined-redis' };
        }
      }

      const testInstance = new TestClassUndefinedRedis();
      
      // Mock the logger to suppress warning output during test
      jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const result = await testInstance.getData();

      expect(result).toEqual({ data: 'undefined-redis' });
    });
  });

  describe('error handling', () => {
    it('should fallback to original method when cache get fails', async () => {
      mockRedisService.get.mockRejectedValue(new Error('Cache get error'));

      // Mock the logger to suppress error output during test
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await testClass.getData();

      expect(result).toEqual({ data: 'test' });
    });

    it('should continue when cache set fails', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockRejectedValue(new Error('Cache set error'));

      // Mock the logger to suppress error output during test
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await testClass.getData();

      expect(result).toEqual({ data: 'test' });
    });

    it('should handle original method errors', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Mock the logger to suppress error output during test
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(testClass.getDataWithError()).rejects.toThrow('Method error');
    });

    it('should handle errors in original method after cache operations fail', async () => {
      mockRedisService.get.mockRejectedValue(new Error('Cache error'));

      // Mock the logger to suppress error output during test
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(testClass.getDataWithError()).rejects.toThrow('Method error');
    });
  });

  describe('edge cases', () => {
    it('should handle complex objects', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassComplexObject {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:complex' })
        async getData() {
          return {
            nested: { data: 'complex' },
            array: [1, 2, 3],
            number: 42,
            boolean: true,
          };
        }
      }

      const testInstance = new TestClassComplexObject();
      const result = await testInstance.getData();

      expect(result).toEqual({
        nested: { data: 'complex' },
        array: [1, 2, 3],
        number: 42,
        boolean: true,
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:complex',
        {
          nested: { data: 'complex' },
          array: [1, 2, 3],
          number: 42,
          boolean: true,
        },
        300,
      );
    });

    it('should handle async methods with arguments', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassWithArgs {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:args' })
        async getData(arg1: string, arg2: number) {
          return { arg1, arg2, data: 'with-args' };
        }
      }

      const testInstance = new TestClassWithArgs();
      const result = await testInstance.getData('test', 123);

      expect(result).toEqual({ arg1: 'test', arg2: 123, data: 'with-args' });
    });

    it('should handle sync methods converted to async', async () => {
      mockRedisService.get.mockResolvedValue(null);

      class TestClassSync {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:sync' })
        getData() {
          return { data: 'sync' };
        }
      }

      const testInstance = new TestClassSync();
      const result = await (testInstance as any).getData();

      expect(result).toEqual({ data: 'sync' });
    });
  });

  describe('logging', () => {
    it('should log cache hit', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
      mockRedisService.get.mockResolvedValue({ data: 'cached' });

      await testClass.getData();

      expect(loggerSpy).toHaveBeenCalledWith('Cache hit for key: test:key');
      loggerSpy.mockRestore();
    });

    it('should log cache miss', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
      mockRedisService.get.mockResolvedValue(null);

      await testClass.getData();

      expect(loggerSpy).toHaveBeenCalledWith('Cache miss for key: test:key');
      loggerSpy.mockRestore();
    });

    it('should log successful cache set', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
      mockRedisService.get.mockResolvedValue(null);

      await testClass.getData();

      expect(loggerSpy).toHaveBeenCalledWith('Cached result for key: test:key with TTL: 60');
      loggerSpy.mockRestore();
    });

    it('should log when not caching null/undefined results', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
      mockRedisService.get.mockResolvedValue(null);

      class TestClassNull {
        redisService = mockRedisService;

        @Cacheable({ key: 'test:null' })
        async getData() {
          return null;
        }
      }

      const testInstance = new TestClassNull();
      await testInstance.getData();

      expect(loggerSpy).toHaveBeenCalledWith('Not caching null/undefined result for key: test:null');
      loggerSpy.mockRestore();
    });
  });
});
