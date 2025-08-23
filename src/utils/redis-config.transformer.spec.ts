import { Redis, Cluster } from 'ioredis';
import { RedisConfigTransformer } from './redis-config.transformer';
import { AdvancedRedisConfig } from '../interfaces/redis-config.interface';

// Mock ioredis
jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  Cluster: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe('RedisConfigTransformer', () => {
  let transformer: RedisConfigTransformer;
  const MockedRedis = Redis as jest.MockedClass<typeof Redis>;
  const MockedCluster = Cluster as jest.MockedClass<typeof Cluster>;

  beforeEach(() => {
    transformer = new RedisConfigTransformer();
    jest.clearAllMocks();
    
    // Mock environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('transform', () => {
    describe('standalone configuration', () => {
      it('should transform basic standalone config', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          url: 'redis://localhost:6379',
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'localhost',
          port: 6379,
        });
      });

      it('should transform standalone config with host and port', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'redis-server',
          port: 6380,
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'redis-server',
          port: 6380,
        });
      });

      it('should parse URL with authentication', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          url: 'redis://user:password@localhost:6379/2',
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'localhost',
          port: 6379,
          username: 'user',
          password: 'password',
          db: 2,
        });
      });

      it('should handle URL without port', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          url: 'redis://localhost',
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'localhost',
          port: 6379,
        });
      });

      it('should throw error for invalid URL', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          url: 'invalid-url',
        };

        expect(() => transformer.transform(config)).toThrow('Invalid Redis URL');
      });

      it('should set default host when no URL or host provided', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'localhost',
          port: 6379,
        });
      });

      it('should set key prefix', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          keyPrefix: 'myapp:',
        };

        const options = transformer.transform(config);
        
        expect(options.keyPrefix).toBe('myapp:');
      });

      it('should set security options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          security: {
            password: 'secret',
            username: 'user',
            db: 1,
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          password: 'secret',
          username: 'user',
          db: 1,
        });
      });

      it('should set TLS options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          tls: {
            enabled: true,
            ca: '/path/to/ca.pem',
            cert: '/path/to/cert.pem',
            key: '/path/to/key.pem',
            rejectUnauthorized: false,
            servername: 'redis.example.com',
          },
        };

        const options = transformer.transform(config);
        
        expect(options.tls).toMatchObject({
          ca: '/path/to/ca.pem',
          cert: '/path/to/cert.pem',
          key: '/path/to/key.pem',
          rejectUnauthorized: false,
          servername: 'redis.example.com',
          minVersion: 'TLSv1.2',
        });
      });

      it('should set performance options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          performance: {
            keepAlive: true,
            keepAliveDelay: 60000,
            connectTimeout: 5000,
            commandTimeout: 3000,
            enableAutoPipelining: true,
            maxAutoPipelineCommands: 200,
            noDelay: false,
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          keepAlive: true,
          keepAliveDelay: 60000,
          connectTimeout: 5000,
          commandTimeout: 3000,
          enableAutoPipelining: true,
          maxAutoPipelineCommands: 200,
          noDelay: false,
        });
      });

      it('should set retry options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          retry: {
            retryDelayOnFailover: 2000,
            maxRetriesPerRequest: 5,
            retryStrategy: (times) => times * 100,
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          retryDelayOnFailover: 2000,
          maxRetriesPerRequest: 5,
          enableOfflineQueue: true,
          retryStrategy: expect.any(Function),
        });
      });

      it('should merge custom options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          customOptions: {
            family: 6,
            lazyConnect: true,
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          family: 6,
          lazyConnect: true,
        });
      });
    });

    describe('cluster configuration', () => {
      it('should transform cluster config', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          cluster: {
            nodes: [
              { host: 'redis-1', port: 6379 },
              { host: 'redis-2', port: 6379 },
            ],
            options: {
              maxRedirections: 32,
              enableReadyCheck: true,
              scaleReads: 'all',
            },
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          maxRedirections: 32,
          enableReadyCheck: true,
          scaleReads: 'all',
          redisOptions: expect.any(Object),
        });
      });

      it('should set default cluster options', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          cluster: {
            nodes: [
              { host: 'redis-1', port: 6379 },
            ],
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          maxRedirections: 16,
          enableReadyCheck: true,
          retryDelayOnClusterDown: 100,
          retryDelayOnFailover: 5000,
          scaleReads: 'master',
          redisOptions: expect.any(Object),
        });
      });

      it('should include key prefix in cluster config', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          keyPrefix: 'cluster:',
          cluster: {
            nodes: [
              { host: 'redis-1', port: 6379 },
            ],
          },
        };

        const options = transformer.transform(config);
        
        expect(options.keyPrefix).toBe('cluster:');
      });

      it('should throw error when cluster nodes missing', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
        };

        expect(() => transformer.transform(config)).toThrow('Cluster configuration is required for cluster type');
      });

      it('should throw error when cluster config is undefined', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          cluster: undefined,
        };

        expect(() => transformer.transform(config)).toThrow('Cluster configuration is required for cluster type');
      });
    });

    describe('sentinel configuration', () => {
      it('should transform sentinel config', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: {
            sentinels: [
              { host: 'sentinel-1', port: 26379 },
              { host: 'sentinel-2', port: 26380, password: 'sentinel-pass' },
            ],
            name: 'mymaster',
            options: {
              sentinelPassword: 'sentinel-secret',
              sentinelRetryDelayOnFailover: 500,
              role: 'slave',
            },
          },
        };

        const options = transformer.transform(config);
        
        expect(options.sentinels).toEqual([
          { host: 'sentinel-1', port: 26379, password: undefined },
          { host: 'sentinel-2', port: 26380, password: 'sentinel-pass' },
        ]);
        expect(options.name).toBe('mymaster');
        expect(options.sentinelPassword).toBe('sentinel-secret');
        expect(options.sentinelRetryDelayOnFailover).toBe(500);
        expect(options.role).toBe('slave');
      });

      it('should set default sentinel port', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: {
            sentinels: [
              { host: 'sentinel-1' },
            ],
            name: 'mymaster',
          },
        };

        const options = transformer.transform(config);
        
        expect(options.sentinels).toEqual([
          { host: 'sentinel-1', port: 26379, password: undefined },
        ]);
      });

      it('should throw error when sentinel config missing', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
        };

        expect(() => transformer.transform(config)).toThrow('Sentinel configuration is required for sentinel type');
      });

      it('should throw error when sentinel config is undefined', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: undefined,
        };

        expect(() => transformer.transform(config)).toThrow('Sentinel configuration is required for sentinel type');
      });
    });

    describe('environment overrides', () => {
      it('should apply environment-specific overrides', () => {
        process.env.NODE_ENV = 'production';
        
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'localhost',
          environment: {
            production: {
              host: 'prod-redis',
              port: 6380,
            },
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'prod-redis',
          port: 6380,
        });
      });

      it('should not apply overrides for non-matching environment', () => {
        process.env.NODE_ENV = 'development';
        
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'localhost',
          environment: {
            production: {
              host: 'prod-redis',
            },
          },
        };

        const options = transformer.transform(config);
        
        expect(options.host).toBe('localhost');
      });
    });

    describe('validation', () => {
      it('should validate cluster configuration', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          cluster: {
            nodes: [],
          },
        };

        expect(() => transformer.transform(config)).toThrow('Cluster configuration requires at least one node');
      });

      it('should validate sentinel configuration', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: {
            sentinels: [],
            name: 'mymaster',
          },
        };

        expect(() => transformer.transform(config)).toThrow('Sentinel configuration requires at least one sentinel');
      });

      it('should validate sentinel name', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: {
            sentinels: [{ host: 'sentinel-1' }],
            name: '',
          },
        };

        expect(() => transformer.transform(config)).toThrow('Sentinel configuration requires a master name');
      });

      it('should validate TLS configuration', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          tls: {
            enabled: true,
            cert: '/path/to/cert.pem',
          },
        };

        expect(() => transformer.transform(config)).toThrow('TLS key is required when certificate is provided');
      });

      it('should validate pool configuration', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          pool: {
            max: 5,
            min: 10,
          },
        };

        expect(() => transformer.transform(config)).toThrow('Pool max connections must be greater than or equal to min connections');
      });

      it('should validate retry configuration', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          retry: {
            retries: -1,
          },
        };

        expect(() => transformer.transform(config)).toThrow('Retry count must be non-negative');
      });

      it('should validate retry delay', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          retry: {
            retryDelayOnFailover: -100,
          },
        };

        expect(() => transformer.transform(config)).toThrow('Retry delay must be non-negative');
      });

      it('should throw error for unsupported connection type', () => {
        const config: AdvancedRedisConfig = {
          type: 'unsupported' as any,
        };

        expect(() => transformer.transform(config)).toThrow('Unsupported Redis connection type: unsupported');
      });

      it('should handle createClient with invalid cluster config', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          // Missing cluster nodes
        };

        expect(() => transformer.createClient(config)).toThrow('Cluster nodes are required for cluster configuration');
      });

      it('should validate TLS key without certificate', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          tls: {
            enabled: true,
            key: '/path/to/key.pem',
            // Missing certificate
          },
        };

        expect(() => transformer.transform(config)).toThrow('TLS certificate is required when key is provided');
      });

      it('should handle cluster config with redisOptions', () => {
        const config: AdvancedRedisConfig = {
          type: 'cluster',
          cluster: {
            nodes: [{ host: 'redis-1', port: 6379 }],
            options: {
              enableReadyCheck: false,
              maxRedirections: 32,
              clusterRetryDelayOnClusterDown: 200,
              clusterRetryDelayOnFailover: 3000,
              scaleReads: 'slave',
            },
          },
          keyPrefix: 'cluster:',
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          enableReadyCheck: false,
          maxRedirections: 32,
          retryDelayOnClusterDown: 200,
          retryDelayOnFailover: 3000,
          scaleReads: 'slave',
          keyPrefix: 'cluster:',
        });
      });

      it('should handle sentinel config with all options', () => {
        const config: AdvancedRedisConfig = {
          type: 'sentinel',
          sentinel: {
            sentinels: [
              { host: 'sentinel-1', port: 26379, password: 'pass1' },
              { host: 'sentinel-2', port: 26380 },
            ],
            name: 'mymaster',
            options: {
              sentinelPassword: 'sentinel-pass',
              sentinelRetryDelayOnFailover: 1000,
              role: 'slave',
              preferredSlaves: [{ ip: '127.0.0.1', port: '6380', flags: '.*' }],
            },
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          sentinels: [
            { host: 'sentinel-1', port: 26379, password: 'pass1' },
            { host: 'sentinel-2', port: 26380, password: undefined },
          ],
          name: 'mymaster',
          sentinelPassword: 'sentinel-pass',
          sentinelRetryDelayOnFailover: 1000,
          role: 'slave',
          preferredSlaves: [{ ip: '127.0.0.1', port: '6380', flags: '.*' }],
        });
      });

      it('should handle standalone config with pool settings', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'redis',
          port: 6379,
          pool: {
            min: 5,
            max: 20,
          },
          performance: {
            connectTimeout: 8000,
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          host: 'redis',
          port: 6379,
          family: 4,
          connectTimeout: 8000,
        });
      });

      it('should handle performance config with all options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'redis',
          port: 6379,
          performance: {
            keepAlive: false,
            keepAliveDelay: 60000,
            connectTimeout: 5000,
            commandTimeout: 3000,
            enableAutoPipelining: false,
            enableReadyCheck: false,
            noDelay: true,
            maxAutoPipelineCommands: 200,
          },
        };

        const options = transformer.transform(config);
        
        expect(options).toMatchObject({
          keepAlive: false,
          keepAliveDelay: 60000,
          connectTimeout: 5000,
          commandTimeout: 3000,
          enableAutoPipelining: false,
          enableReadyCheck: false,
          noDelay: true,
          maxAutoPipelineCommands: 200,
        });
      });

      it('should handle TLS config with all options', () => {
        const config: AdvancedRedisConfig = {
          type: 'standalone',
          host: 'secure-redis',
          port: 6380,
          tls: {
            enabled: true,
            ca: '/path/to/ca.pem',
            cert: '/path/to/cert.pem',
            key: '/path/to/key.pem',
            rejectUnauthorized: false,
            servername: 'redis.example.com',
            minVersion: 'TLSv1.3',
            maxVersion: 'TLSv1.3',
            ciphers: 'HIGH:!aNULL:!MD5',
          },
        };

        const options = transformer.transform(config);
        
        expect(options.tls).toMatchObject({
          ca: '/path/to/ca.pem',
          cert: '/path/to/cert.pem',
          key: '/path/to/key.pem',
          rejectUnauthorized: false,
          servername: 'redis.example.com',
          minVersion: 'TLSv1.3',
          maxVersion: 'TLSv1.3',
          ciphers: 'HIGH:!aNULL:!MD5',
        });
      });

      it('should handle mergeConfigs with nested objects', () => {
        const transformer = new RedisConfigTransformer();
        const mergeConfigs = (transformer as any).mergeConfigs;
        
        const target = {
          a: 1,
          b: {
            c: 2,
            d: {
              e: 3,
            },
          },
        };
        
        const source = {
          b: {
            d: {
              f: 4,
            },
            g: 5,
          },
          h: 6,
        };
        
        const result = mergeConfigs(target, source);
        
        expect(result).toEqual({
          a: 1,
          b: {
            c: 2,
            d: {
              e: 3,
              f: 4,
            },
            g: 5,
          },
          h: 6,
        });
      });

      it('should handle mergeConfigs with arrays', () => {
        const transformer = new RedisConfigTransformer();
        const mergeConfigs = (transformer as any).mergeConfigs;
        
        const target = {
          array: [1, 2, 3],
        };
        
        const source = {
          array: [4, 5, 6],
        };
        
        const result = mergeConfigs(target, source);
        
        expect(result.array).toEqual([4, 5, 6]);
      });
    });
  });

  describe('createClient', () => {
    it('should create Redis instance for standalone', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        port: 6379,
      };

      const client = transformer.createClient(config);
      
      expect(MockedRedis).toHaveBeenCalled();
      expect(client).toBeInstanceOf(Redis);
    });

    it('should create Cluster instance for cluster', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: {
          nodes: [
            { host: 'redis-1', port: 6379 },
            { host: 'redis-2', port: 6379 },
          ],
        },
      };

      const client = transformer.createClient(config);
      
      expect(MockedCluster).toHaveBeenCalledWith(
        config.cluster.nodes,
        expect.any(Object)
      );
      expect(client).toBeInstanceOf(Cluster);
    });

    it('should create Redis instance for sentinel', () => {
      const config: AdvancedRedisConfig = {
        type: 'sentinel',
        sentinel: {
          sentinels: [{ host: 'sentinel-1', port: 26379 }],
          name: 'mymaster',
        },
      };

      const client = transformer.createClient(config);
      
      expect(MockedRedis).toHaveBeenCalled();
      expect(client).toBeInstanceOf(Redis);
    });

    it('should throw error for cluster without nodes', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
      };

      expect(() => transformer.createClient(config)).toThrow('Cluster nodes are required for cluster configuration');
    });

    it('should create Cluster instance with valid cluster config', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: {
          nodes: [
            { host: 'redis-1', port: 6379 },
            { host: 'redis-2', port: 6379 },
          ],
        },
      };

      const client = transformer.createClient(config);
      
      expect(MockedCluster).toHaveBeenCalledWith(
        config.cluster.nodes,
        expect.any(Object)
      );
      expect(client).toBeInstanceOf(Cluster);
    });
  });

  describe('getConfigSummary', () => {
    it('should return config summary for standalone', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'redis-server',
        port: 6380,
        keyPrefix: 'app:',
        tls: { enabled: true },
      };

      const summary = transformer.getConfigSummary(config);
      const parsed = JSON.parse(summary);
      
      expect(parsed).toMatchObject({
        type: 'standalone',
        host: 'redis-server',
        port: 6380,
        keyPrefix: 'app:',
        tls: true,
        cluster: false,
        sentinel: false,
      });
    });

    it('should return config summary for cluster', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: {
          nodes: [
            { host: 'redis-1', port: 6379 },
            { host: 'redis-2', port: 6379 },
            { host: 'redis-3', port: 6379 },
          ],
        },
      };

      const summary = transformer.getConfigSummary(config);
      const parsed = JSON.parse(summary);
      
      expect(parsed).toMatchObject({
        type: 'cluster',
        cluster: '3 nodes',
        sentinel: false,
        tls: false,
      });
    });

    it('should return config summary for sentinel', () => {
      const config: AdvancedRedisConfig = {
        type: 'sentinel',
        sentinel: {
          sentinels: [
            { host: 'sentinel-1', port: 26379 },
            { host: 'sentinel-2', port: 26379 },
          ],
          name: 'mymaster',
        },
      };

      const summary = transformer.getConfigSummary(config);
      const parsed = JSON.parse(summary);
      
      expect(parsed).toMatchObject({
        type: 'sentinel',
        cluster: false,
        sentinel: '2 sentinels',
        tls: false,
      });
    });

    it('should handle missing configuration gracefully', () => {
      const config: AdvancedRedisConfig = {};

      const summary = transformer.getConfigSummary(config);
      const parsed = JSON.parse(summary);
      
      expect(parsed).toMatchObject({
        type: 'standalone',
        host: 'localhost',
        port: 6379,
        keyPrefix: 'none',
        tls: false,
        cluster: false,
        sentinel: false,
      });
    });

    it('should transform config with no type specified', () => {
      const config: AdvancedRedisConfig = {
        host: 'redis-server',
        port: 6380,
      };

      const options = transformer.transform(config);
      
      expect(options).toMatchObject({
        host: 'redis-server',
        port: 6380,
      });
    });
  });

  describe('private method validation paths', () => {
    it('should trigger line 185 - transformClusterConfig with null cluster', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: null as any, // This should trigger line 185: !config.cluster
      };

      // Call the private method directly using bracket notation
      expect(() => (transformer as any).transformClusterConfig(config)).toThrow('Cluster configuration is required for cluster type');
    });

    it('should trigger line 216 - transformSentinelConfig with null sentinel', () => {
      const config: AdvancedRedisConfig = {
        type: 'sentinel',
        sentinel: null as any, // This should trigger line 216: !config.sentinel
      };

      // Call the private method directly using bracket notation
      expect(() => (transformer as any).transformSentinelConfig(config)).toThrow('Sentinel configuration is required for sentinel type');
    });

    it('should trigger line 44 - createClient cluster validation after transform', () => {
      // We need to spy on transform to return options but still allow the createClient validation to run
      const transformSpy = jest.spyOn(transformer, 'transform').mockReturnValue({} as any);
      
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: null as any, // This should trigger line 44: !config.cluster?.nodes
      };

      expect(() => transformer.createClient(config)).toThrow('Cluster nodes are required for cluster configuration');
      
      transformSpy.mockRestore();
    });
  });

  describe('environment handling', () => {
    it('should default to development when NODE_ENV is undefined', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        environment: {
          development: {
            host: 'dev-redis'
          }
        }
      };

      const options = transformer.transform(config);
      
      expect(options.host).toBe('dev-redis');
      
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should handle deep merge with new implementation (nested object merging)', () => {
      // Test the new mergeConfigs implementation with nested objects
      const target = {
        performance: {
          keepAlive: true,
          connectTimeout: 5000
        }
      };
      
      const source = {
        performance: {
          commandTimeout: 3000,
          enableAutoPipelining: false
        }
      };

      // Call the private mergeConfigs method directly
      const result = (transformer as any).mergeConfigs(target, source);
      
      expect(result).toEqual({
        performance: {
          keepAlive: true,
          connectTimeout: 5000,
          commandTimeout: 3000,
          enableAutoPipelining: false
        }
      });
    });

    it('should handle deep merge when target is empty (new mergeConfigs branch coverage)', () => {
      // Test mergeConfigs when target is empty/null - covers the || {} branch in line 346
      const target = null;
      
      const source = {
        performance: {
          commandTimeout: 3000,
          enableAutoPipelining: false
        }
      };

      // Call the private mergeConfigs method directly 
      const result = (transformer as any).mergeConfigs(target, source);
      
      expect(result).toEqual({
        performance: {
          commandTimeout: 3000,
          enableAutoPipelining: false
        }
      });
    });

    it('should handle deep merge with null/undefined source properties', () => {
      // Test mergeConfigs branch coverage for line 350 - the ?? {} operator
      const target = {};
      
      const source = {
        performance: {
          commandTimeout: 3000,
          nestedConfig: {
            setting: 'value'
          }
        }
      };

      const result = (transformer as any).mergeConfigs(target, source);
      
      expect(result).toEqual({
        performance: {
          commandTimeout: 3000,
          nestedConfig: {
            setting: 'value'
          }
        }
      });
    });

    it('should use performance.connectTimeout when pool is enabled (line 169 branch coverage)', () => {
      // This test targets line 169: config.performance?.connectTimeout || 10000
      // We need performance.connectTimeout to be truthy, so || 10000 isn't used
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        pool: {
          max: 10,
          min: 1
        },
        performance: {
          connectTimeout: 8000 // This should be used instead of 10000 fallback
        }
      };

      const options = transformer.transform(config);
      
      expect(options.connectTimeout).toBe(8000); // Should use the configured value
    });

    it('should use default connectTimeout when pool is enabled but performance.connectTimeout is undefined (line 169 fallback)', () => {
      // This test targets the OTHER side of line 169: config.performance?.connectTimeout || 10000
      // We need performance.connectTimeout to be undefined/falsy, so || 10000 is used
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        pool: {
          max: 10,
          min: 1
        }
        // No performance config, so performance?.connectTimeout is undefined
      };

      const options = transformer.transform(config);
      
      expect(options.connectTimeout).toBe(10000); // Should use the 10000 fallback
    });

    it('should handle nested auth structure with password and db (lines 130, 133)', () => {
      // This test targets the new nested auth structure to cover lines 130 and 133
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        security: {
          auth: {
            username: 'nested-user',
            password: 'nested-pass',
            db: 2
          }
        } as any // Cast to any to allow the auth property
      };

      const options = transformer.transform(config);
      
      expect(options.username).toBe('nested-user');
      expect(options.password).toBe('nested-pass'); // Covers line 130
      expect(options.db).toBe(2); // Covers line 133
    });

    it('should handle URL parsing with database number', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        url: 'redis://localhost:6379/5'
      };

      const options = transformer.transform(config);
      
      expect(options.db).toBe(5);
    });

    it('should handle URL parsing with invalid database number', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        url: 'redis://localhost:6379/invalid'
      };

      const options = transformer.transform(config);
      
      expect(options.db).toBe(0);
    });

    it('should use default performance settings when not provided', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        performance: {} // Empty performance config to trigger defaults
      };

      const options = transformer.transform(config);
      
      expect(options.connectTimeout).toBe(10000);
    });

    it('should use default retry settings when not provided', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        retry: {} // Empty retry config to trigger defaults
      };

      const options = transformer.transform(config);
      
      expect(options.retryDelayOnFailover).toBe(1000);
      expect(options.maxRetriesPerRequest).toBe(3);
    });

    it('should use default cluster settings when not provided', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: {
          nodes: [{ host: 'localhost', port: 6379 }],
          options: {} // Empty options to trigger defaults
        }
      };

      const options = transformer.transform(config);
      
      expect(options.maxRedirections).toBe(16);
    });

    it('should handle mergeConfigs with undefined target', () => {
      const config: AdvancedRedisConfig = {
        type: 'standalone',
        host: 'localhost',
        security: {
          auth: {
            username: 'user'
          }
        }
      };

      const options = transformer.transform(config);
      
      expect(options.username).toBe('user');
    });

    it('should handle config summary with no cluster nodes', () => {
      const config: AdvancedRedisConfig = {
        type: 'cluster',
        cluster: {} // No nodes to trigger || 0 branch
      };

      const summary = transformer.getConfigSummary(config);
      const parsed = JSON.parse(summary);
      
      expect(parsed.cluster).toBe('0 nodes');
    });

    it('should handle config summary with no sentinel sentinels', () => {
      const config: AdvancedRedisConfig = {
        type: 'sentinel',
        sentinel: {} // No sentinels to trigger || 0 branch
      };

      const summary = transformer.getConfigSummary(config);
      const parsed = JSON.parse(summary);
      
      expect(parsed.sentinel).toBe('0 sentinels');
    });
  });

  describe('createRedisConfigTransformer', () => {
    it('should create a new transformer instance', () => {
      const { createRedisConfigTransformer } = require('./redis-config.transformer');
      const transformer = createRedisConfigTransformer();
      expect(transformer).toBeInstanceOf(RedisConfigTransformer);
    });
  });
});