# NestJS Redis Cache - Examples

This directory contains comprehensive examples demonstrating how to use the `nestjs-redis-cache` package in real-world scenarios.

## 📁 Examples Overview

### 🚀 [Basic Usage](./basic-usage/)
A simple example demonstrating fundamental caching concepts:
- **Module Configuration**: Sync configuration with `forRoot()`
- **@Cacheable Decorator**: Basic caching with TTL
- **RedisService**: Direct Redis operations
- **Key Generation**: Global and module-level scoping
- **Error Handling**: Graceful fallbacks

**Perfect for**: Getting started, learning the basics, simple applications

### 🎯 [Advanced Usage](./advanced-usage/)
A comprehensive example showcasing complex caching scenarios:
- **Async Module Configuration**: Dynamic configuration with environment variables
- **Complex Caching Patterns**: Multiple TTLs, scopes, and data types
- **E-commerce Scenarios**: Product catalog, reviews, search, categories
- **Analytics Caching**: Dashboard data, product analytics, sales reports
- **User-Specific Caching**: Notifications with user context
- **Advanced Cache Management**: Health checks, pattern-based operations

**Perfect for**: Production applications, complex caching requirements, learning advanced patterns

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Redis server running locally or accessible via URL
- npm or yarn

### Running Examples

1. **Start Redis Server**
   ```bash
   # Local Redis
   redis-server
   
   # Or using Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Choose an Example**
   ```bash
   # Basic Example
   cd examples/basic-usage
   npm install
   npm run dev
   
   # Advanced Example
   cd examples/advanced-usage
   npm install
   cp env.example .env  # Configure environment
   npm run dev
   ```

3. **Test the Examples**
   ```bash
   # Basic Example (Port 3000)
   curl http://localhost:3000/users/1
   curl http://localhost:3000/products/1
   curl http://localhost:3000/cache/stats
   
   # Advanced Example (Port 3001)
   curl http://localhost:3001/products/1
   curl http://localhost:3001/analytics/dashboard
   curl http://localhost:3001/cache/health
   ```

## 📊 Feature Comparison

| Feature                   | Basic Example            | Advanced Example                 |
| ------------------------- | ------------------------ | -------------------------------- |
| **Module Configuration**  | Sync (`forRoot`)         | Async (`forRootAsync`)           |
| **Environment Variables** | ❌                        | ✅                                |
| **Caching Scenarios**     | Simple (users, products) | Complex (e-commerce, analytics)  |
| **TTL Strategies**        | Fixed TTLs               | Variable TTLs                    |
| **Scope Management**      | Global + Module          | Global + Module + User           |
| **Cache Management**      | Basic stats              | Health checks, patterns, warming |
| **Error Handling**        | Basic fallbacks          | Comprehensive error management   |
| **Data Types**            | Simple objects           | Complex nested data              |
| **API Endpoints**         | 10 endpoints             | 20+ endpoints                    |
| **Testing**               | Manual testing           | Comprehensive scenarios          |

## 🎯 Use Case Scenarios

### Choose Basic Example If:
- ✅ Learning NestJS caching concepts
- ✅ Building simple applications
- ✅ Need basic Redis caching
- ✅ Want to understand the fundamentals
- ✅ Have simple data structures
- ✅ Need quick setup and testing

### Choose Advanced Example If:
- ✅ Building production applications
- ✅ Need complex caching strategies
- ✅ Working with multiple data types
- ✅ Require environment-based configuration
- ✅ Need advanced cache management
- ✅ Building e-commerce or analytics applications
- ✅ Want to learn best practices

## 🔧 Configuration Examples

### Basic Configuration
```typescript
// examples/basic-usage/src/app.module.ts
CachingModule.forRoot({
  redisUrl: 'redis://localhost:6379',
  keyPrefix: 'example:',
})
```

### Advanced Configuration
```typescript
// examples/advanced-usage/src/app.module.ts
CachingModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    redisUrl: configService.get('REDIS_URL'),
    keyPrefix: configService.get('CACHE_PREFIX'),
    maxRetries: configService.get('REDIS_MAX_RETRIES'),
    retryDelay: configService.get('REDIS_RETRY_DELAY'),
  }),
  inject: [ConfigService],
})
```

## 🎨 Caching Patterns

### Basic Patterns
```typescript
// Simple caching
@Cacheable({ key: 'user', ttl: 300 })
async getUser(id: string) { /* ... */ }

// Module-scoped caching
@Cacheable({ 
  key: 'user:profile', 
  ttl: 600, 
  scope: 'module',
  moduleName: 'UserModule'
})
async getUserProfile(id: string) { /* ... */ }
```

### Advanced Patterns
```typescript
// Complex data caching
@Cacheable({ key: 'analytics:sales', ttl: 900 })
async getSalesAnalytics(start: string, end: string) { /* ... */ }

// User-specific caching
@Cacheable({ 
  key: 'notifications:user', 
  ttl: 600, 
  scope: 'module',
  moduleName: 'NotificationModule'
})
async getUserNotifications(userId: string, unreadOnly: boolean) { /* ... */ }
```

## 🧪 Testing Scenarios

### Basic Testing
```bash
# Test user caching
curl http://localhost:3000/users/1
curl http://localhost:3000/users/1  # Should be faster (cache hit)

# Test product caching
curl http://localhost:3000/products/1
curl http://localhost:3000/products/1  # Should be faster (cache hit)

# Check cache stats
curl http://localhost:3000/cache/stats
```

### Advanced Testing
```bash
# Test e-commerce workflow
curl http://localhost:3001/products/1
curl http://localhost:3001/products/1/reviews?page=1
curl http://localhost:3001/products/1/related
curl http://localhost:3001/search?q=iPhone

# Test analytics
curl http://localhost:3001/analytics/dashboard?period=7d
curl http://localhost:3001/analytics/products/1?period=30d

# Test cache management
curl http://localhost:3001/cache/health
curl http://localhost:3001/cache/stats/detailed
```

## 📈 Performance Monitoring

### Basic Monitoring
```bash
# Check cache stats
curl http://localhost:3000/cache/stats

# Clear cache
curl -X DELETE http://localhost:3000/cache/clear
```

### Advanced Monitoring
```bash
# Health check
curl http://localhost:3001/cache/health

# Pattern-based operations
curl http://localhost:3001/cache/patterns/advanced:product:*
curl -X DELETE http://localhost:3001/cache/patterns/advanced:analytics:*

# Detailed statistics
curl http://localhost:3001/cache/stats/detailed
```

## 🛠️ Development Workflow

### 1. **Setup Development Environment**
```bash
# Clone the repository
git clone <repository-url>
cd nestjs-redis-cache

# Install dependencies
npm install

# Start Redis
redis-server
```

### 2. **Choose Your Example**
```bash
# For learning basics
cd examples/basic-usage
npm install
npm run dev

# For advanced scenarios
cd examples/advanced-usage
npm install
cp env.example .env
npm run dev
```

### 3. **Test and Experiment**
```bash
# Test basic functionality
curl http://localhost:3000/users/1

# Test advanced features
curl http://localhost:3001/analytics/dashboard

# Monitor cache behavior
curl http://localhost:3000/cache/stats
curl http://localhost:3001/cache/health
```

### 4. **Customize for Your Needs**
- Modify TTL values based on your data volatility
- Adjust key naming strategies for your domain
- Implement custom error handling
- Add your own caching patterns

## 🔍 Troubleshooting

### Common Issues

1. **Redis Connection Issues**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Should return PONG
   ```

2. **Port Conflicts**
   ```bash
   # Basic example uses port 3000
   # Advanced example uses port 3001
   # Check if ports are available
   lsof -i :3000
   lsof -i :3001
   ```

3. **Environment Configuration**
   ```bash
   # For advanced example, ensure .env file exists
   cp env.example .env
   # Edit .env with your Redis configuration
   ```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=nestjs-redis-cache:*

# Run with debug output
npm run dev
```

## 📚 Learning Path

### Beginner Path
1. Start with [Basic Usage](./basic-usage/)
2. Understand module configuration
3. Learn @Cacheable decorator usage
4. Practice with RedisService operations
5. Experiment with different TTL values

### Advanced Path
1. Complete [Basic Usage](./basic-usage/) first
2. Move to [Advanced Usage](./advanced-usage/)
3. Study async module configuration
4. Learn complex caching patterns
5. Implement advanced cache management
6. Build your own caching strategies

## 🤝 Contributing

Want to add more examples? Here's how:

1. **Create a new example directory**
   ```bash
   mkdir examples/your-example
   cd examples/your-example
   ```

2. **Follow the structure**
   - `package.json` with dependencies
   - `tsconfig.json` for TypeScript
   - `src/` directory with your code
   - `README.md` with documentation
   - `.gitignore` for the example

3. **Document your example**
   - Explain the use case
   - Provide setup instructions
   - Include testing scenarios
   - Add troubleshooting tips

## 📖 Additional Resources

- [Package Documentation](../README.md)
- [API Reference](../src/)
- [Test Suite](../test/)
- [Contributing Guidelines](../CONTRIBUTING.md)

## 🎯 Next Steps

After exploring the examples:

1. **Integrate into your project**
   - Copy relevant patterns
   - Adapt to your domain
   - Customize configuration

2. **Explore advanced features**
   - Cache invalidation strategies
   - Cache warming techniques
   - Performance optimization

3. **Build your own examples**
   - Share with the community
   - Contribute to documentation
   - Help others learn

---

**Happy Caching! 🚀** 
