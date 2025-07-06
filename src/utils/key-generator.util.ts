import { CacheScope } from '../types/cache-scope.type';

/**
 * Generate a cache key with optional scoping
 * @param key - The base cache key
 * @param scope - The scope type ('global' or 'module')
 * @param moduleName - The module name (required for module scope)
 * @returns The generated cache key
 */
export function generateCacheKey(
  key: string,
  scope: CacheScope = 'global',
  moduleName?: string,
): string {
  if (scope === 'module' && !moduleName) {
    throw new Error('Module name is required for module scope');
  }

  if (scope === 'module') {
    return `${moduleName}:${key}`;
  }

  return key;
}

/**
 * Generate a cache key with prefix
 * @param key - The base cache key
 * @param prefix - The key prefix
 * @param scope - The scope type
 * @param moduleName - The module name (for module scope)
 * @returns The generated cache key with prefix
 */
export function generatePrefixedCacheKey(
  key: string,
  prefix: string = '',
  scope: CacheScope = 'global',
  moduleName?: string,
): string {
  const baseKey = generateCacheKey(key, scope, moduleName);
  return prefix ? `${prefix}${baseKey}` : baseKey;
}
