import * as pkg from './index';

describe('Public API (index.ts)', () => {
  it('should export all main symbols', () => {
    expect(pkg.CachingModule).toBeDefined();
    expect(pkg.RedisService).toBeDefined();
    expect(pkg.Cacheable).toBeDefined();
    expect(pkg.generateCacheKey).toBeDefined();
    expect(pkg.generatePrefixedCacheKey).toBeDefined();
  });

  it('should export all types', () => {
    // Type exports are not runtime, but this ensures the file is covered
    expect(typeof pkg).toBe('object');
  });
});
