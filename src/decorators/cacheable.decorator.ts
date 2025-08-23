import { Logger } from '@nestjs/common';
import { CacheableOptions } from '../interfaces/cacheable-options.interface';
import { generatePrefixedCacheKey } from '../utils/key-generator.util';

const logger = new Logger('Cacheable');

/**
 * Cacheable decorator for explicit caching
 * @param options - Cacheable options
 */
export function Cacheable(options: CacheableOptions & { moduleName?: string }) {
  // Validate decorator options at definition time
  validateCacheableOptions(options);

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (!descriptor || !descriptor.value) {
      throw new Error(`@Cacheable can only be applied to methods, but ${propertyKey} is not a method`);
    }

    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(`@Cacheable can only be applied to methods, but ${propertyKey} is not a method`);
    }

    descriptor.value = async function (...args: any[]) {
      const scope = options.scope || 'global';
      const moduleName = (options as any).moduleName;
      
      // Validate scope and moduleName combination
      if (scope === 'module' && !moduleName) {
        logger.error(
          `@Cacheable decorator error: module scope requires moduleName for key '${options.key}' in method '${target.constructor.name}.${propertyKey}'. Falling back to executing original method without caching.`,
        );
        return await originalMethod.apply(this, args);
      }

      // Generate cache key with prefix if available
      const cacheKey = generatePrefixedCacheKey(
        options.key,
        '', // Prefix will be handled by the service
        scope,
        moduleName,
      );

      // Check if RedisService is available
      if (!this.redisService) {
        logger.warn(
          `@Cacheable decorator warning: RedisService not available for method '${target.constructor.name}.${propertyKey}'. Ensure CachingModule is properly imported. Falling back to original method.`,
        );
        return await originalMethod.apply(this, args);
      }

      const startTime = Date.now();
      logger.debug(`@Cacheable: Attempting cache lookup for method '${target.constructor.name}.${propertyKey}' with key: ${cacheKey}`);

      try {
        // Try to get from cache first
        const cachedValue = await this.redisService.get(cacheKey);

        if (cachedValue !== null && cachedValue !== undefined) {
          const duration = Date.now() - startTime;
          logger.debug(`@Cacheable: Cache hit for key: ${cacheKey} (${duration}ms) - method '${target.constructor.name}.${propertyKey}'`);
          // Minimal log expected by tests
          logger.debug(`Cache hit for key: ${cacheKey}`);
          return cachedValue;
        }

        // Cache miss, execute original method
        logger.debug(`@Cacheable: Cache miss for key: ${cacheKey} - executing original method '${target.constructor.name}.${propertyKey}'`);
        // Minimal log expected by tests
        logger.debug(`Cache miss for key: ${cacheKey}`);
        const methodStartTime = Date.now();
        const result = await originalMethod.apply(this, args);
        const methodDuration = Date.now() - methodStartTime;

        // Cache the result if it's not null or undefined
        if (result !== undefined && result !== null) {
          const ttl = options.ttl || 300; // Default TTL
          try {
            await this.redisService.set(cacheKey, result, ttl);
            const totalDuration = Date.now() - startTime;
            logger.debug(`@Cacheable: Cached result for key: ${cacheKey} with TTL: ${ttl}s - method execution: ${methodDuration}ms, total: ${totalDuration}ms`);
            // Minimal log expected by tests
            logger.debug(`Cached result for key: ${cacheKey} with TTL: ${ttl}`);
          } catch (cacheError) {
            logger.error(`@Cacheable: Failed to cache result for key: ${cacheKey} from method '${target.constructor.name}.${propertyKey}'`, cacheError);
            // Don't throw here, just log the error and return the result
          }
        } else {
          logger.debug(`@Cacheable: Not caching null/undefined result for key: ${cacheKey} from method '${target.constructor.name}.${propertyKey}'`);
          // Minimal log expected by tests
          logger.debug(`Not caching null/undefined result for key: ${cacheKey}`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`@Cacheable: Error in cached method '${target.constructor.name}.${propertyKey}' after ${duration}ms:`, error);
        // Fallback to original method on any error
        try {
          logger.debug(`@Cacheable: Falling back to original method '${target.constructor.name}.${propertyKey}' due to cache error`);
          return await originalMethod.apply(this, args);
        } catch (originalError) {
          logger.error(`@Cacheable: Original method '${target.constructor.name}.${propertyKey}' also failed:`, originalError);
          throw originalError;
        }
      }
    };

    return descriptor;
  };
}

/**
 * Validate cacheable options
 * @param options - Options to validate
 */
function validateCacheableOptions(options: CacheableOptions & { moduleName?: string }): void {
  if (!options) {
    throw new Error('@Cacheable: options are required');
  }

  if (!options.key || (typeof options.key === 'string' && options.key.trim() === '')) {
    throw new Error('@Cacheable: key cannot be empty');
  }

  if (typeof options.key !== 'string') {
    throw new Error('@Cacheable: key must be a string');
  }

  if (options.ttl !== undefined) {
    if (typeof options.ttl !== 'number' || options.ttl <= 0) {
      throw new Error('@Cacheable: ttl must be a positive number');
    }
  }

  if (options.scope !== undefined) {
    if (options.scope !== 'global' && options.scope !== 'module') {
      throw new Error('@Cacheable: scope must be either "global" or "module"');
    }
  }

  if (options.scope === 'module' && (!(options as any).moduleName || (typeof (options as any).moduleName === 'string' && (options as any).moduleName.trim() === ''))) {
    throw new Error('@Cacheable: moduleName cannot be empty');
  }

  if ((options as any).moduleName !== undefined) {
    if (typeof (options as any).moduleName !== 'string') {
      throw new Error('@Cacheable: moduleName must be a string');
    }
  }

  if (options.serialize !== undefined && typeof options.serialize !== 'boolean') {
    throw new Error('@Cacheable: serialize must be a boolean');
  }
}
