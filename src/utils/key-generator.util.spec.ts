import {
  generateCacheKey,
  generatePrefixedCacheKey,
} from './key-generator.util';

describe('KeyGenerator', () => {
  describe('generateCacheKey', () => {
    it('should generate global cache key', () => {
      const key = generateCacheKey('user:profile', 'global');
      expect(key).toBe('user:profile');
    });

    it('should generate module cache key', () => {
      const key = generateCacheKey('user:profile', 'module', 'UserModule');
      expect(key).toBe('UserModule:user:profile');
    });

    it('should use global scope by default', () => {
      const key = generateCacheKey('user:profile');
      expect(key).toBe('user:profile');
    });

    it('should throw error for module scope without module name', () => {
      expect(() => {
        generateCacheKey('user:profile', 'module');
      }).toThrow('Module name is required for module scope');
    });

    it('should handle empty key', () => {
      const key = generateCacheKey('', 'global');
      expect(key).toBe('');
    });

    it('should handle special characters in key', () => {
      const key = generateCacheKey('user:profile:123:test', 'global');
      expect(key).toBe('user:profile:123:test');
    });

    it('should throw error when module scope is used without moduleName', () => {
      expect(() => {
        generateCacheKey('test-key', 'module');
      }).toThrow('Module name is required for module scope');
    });

    it('should generate module scoped key with moduleName', () => {
      const result = generateCacheKey('test-key', 'module', 'test-module');
      expect(result).toBe('test-module:test-key');
    });

    it('should generate global key when scope is global', () => {
      const result = generateCacheKey('test-key', 'global');
      expect(result).toBe('test-key');
    });

    it('should generate global key by default', () => {
      const result = generateCacheKey('test-key');
      expect(result).toBe('test-key');
    });
  });

  describe('generatePrefixedCacheKey', () => {
    it('should generate prefixed global cache key', () => {
      const key = generatePrefixedCacheKey('user:profile', 'myapp:', 'global');
      expect(key).toBe('myapp:user:profile');
    });

    it('should generate prefixed module cache key', () => {
      const key = generatePrefixedCacheKey(
        'user:profile',
        'myapp:',
        'module',
        'UserModule',
      );
      expect(key).toBe('myapp:UserModule:user:profile');
    });

    it('should handle empty prefix', () => {
      const key = generatePrefixedCacheKey('user:profile', '', 'global');
      expect(key).toBe('user:profile');
    });

    it('should use global scope by default', () => {
      const key = generatePrefixedCacheKey('user:profile', 'myapp:');
      expect(key).toBe('myapp:user:profile');
    });

    it('should handle empty key with prefix', () => {
      const key = generatePrefixedCacheKey('', 'myapp:', 'global');
      expect(key).toBe('myapp:');
    });

    it('should handle complex prefix', () => {
      const key = generatePrefixedCacheKey(
        'user:profile',
        'prod:cache:v1:',
        'global',
      );
      expect(key).toBe('prod:cache:v1:user:profile');
    });

    it('should throw error for module scope without module name', () => {
      expect(() => {
        generatePrefixedCacheKey('user:profile', 'myapp:', 'module');
      }).toThrow('Module name is required for module scope');
    });

    it('should throw error for module scope without module name in generatePrefixedCacheKey', () => {
      expect(() => {
        generatePrefixedCacheKey('user:profile', 'myapp:', 'module');
      }).toThrow('Module name is required for module scope');
    });

    it('should throw error and catch when module scope is used without moduleName in prefixed key', () => {
      let error;
      try {
        generatePrefixedCacheKey('test-key', 'prefix:', 'module');
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Module name is required for module scope');
    });

    it('should throw error and catch when module scope is used without moduleName in prefixed key with empty prefix', () => {
      let error;
      try {
        generatePrefixedCacheKey('test-key', '', 'module');
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Module name is required for module scope');
    });

    it('should generate prefixed key with global scope and empty prefix', () => {
      const key = generatePrefixedCacheKey('test-key', '', 'global');
      expect(key).toBe('test-key');
    });

    it('should generate prefixed key with module scope and moduleName and empty prefix', () => {
      const key = generatePrefixedCacheKey(
        'test-key',
        '',
        'module',
        'TestModule',
      );
      expect(key).toBe('TestModule:test-key');
    });

    it('should generate prefixed key with module scope and moduleName and non-empty prefix', () => {
      const key = generatePrefixedCacheKey(
        'test-key',
        'prefix:',
        'module',
        'TestModule',
      );
      expect(key).toBe('prefix:TestModule:test-key');
    });
  });
});
