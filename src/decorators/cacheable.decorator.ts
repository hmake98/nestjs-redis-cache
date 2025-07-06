import { Logger } from '@nestjs/common';
import { CacheableOptions } from '../interfaces/cacheable-options.interface';
import { generatePrefixedCacheKey } from '../utils/key-generator.util';

const logger = new Logger('Cacheable');

/**
 * Cacheable decorator for explicit caching
 * @param options - Cacheable options
 */
export function Cacheable(options: CacheableOptions & { moduleName?: string }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let scope = options.scope || 'global';
      const moduleName = (options as any).moduleName;
      if (scope === 'module' && !moduleName) {
        logger.warn(
          `@Cacheable: module scope specified but no moduleName provided for key '${options.key}'. Falling back to global scope.`,
        );
        scope = 'global';
      }
      // Generate cache key with prefix if available
      const cacheKey = generatePrefixedCacheKey(
        options.key,
        '', // Prefix will be handled by the service
        scope,
        moduleName,
      );

      try {
        // Try to get from cache first
        const cachedValue = await this.redisService?.get(cacheKey);

        if (cachedValue !== null) {
          logger.debug(`Cache hit for key: ${cacheKey}`);
          return cachedValue;
        }

        // Cache miss, execute original method
        logger.debug(`Cache miss for key: ${cacheKey}`);
        const result = await originalMethod.apply(this, args);

        // Cache the result
        if (result !== undefined && result !== null) {
          const ttl = options.ttl || 300; // Default TTL
          await this.redisService?.set(cacheKey, result, ttl);
          logger.debug(`Cached result for key: ${cacheKey} with TTL: ${ttl}`);
        }

        return result;
      } catch (error) {
        logger.error(`Error in cacheable method: ${propertyKey}`, error);
        // Fallback to original method on error
        return await originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}
