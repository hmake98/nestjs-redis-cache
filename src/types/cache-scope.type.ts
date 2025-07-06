/**
 * Cache scope types
 */
export type CacheScope = 'global' | 'module';

/**
 * Key generation function type
 */
export type KeyGenerator = (key: string, scope: CacheScope, moduleName?: string) => string; 
