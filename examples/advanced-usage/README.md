# NestJS Redis Cache - Advanced Usage Example

This advanced example demonstrates complex caching scenarios, async module configuration, and sophisticated cache management patterns.

## Features Demonstrated

- ✅ **Async Module Configuration**: Dynamic configuration with environment variables
- ✅ **Complex Caching Patterns**: Multiple TTLs, scopes, and data types
- ✅ **E-commerce Scenarios**: Product catalog, reviews, search, categories
- ✅ **Analytics Caching**: Dashboard data, product analytics, sales reports
- ✅ **User-Specific Caching**: Notifications with user context
- ✅ **Advanced Cache Management**: Health checks, pattern-based operations, detailed stats
- ✅ **Error Handling**: Graceful fallbacks and comprehensive error management

## Prerequisites

- Node.js (v16 or higher)
- Redis server running locally or accessible via URL
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   cd examples/advanced-usage
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your Redis configuration
   ```

3. **Start Redis server:**
   ```bash
   # If you have Redis installed locally
   redis-server
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
CACHE_PREFIX=advanced:

# Redis Connection Settings
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000

# Application Settings
PORT=3001
NODE_ENV=development
```

## Running the Example

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### E-commerce Endpoints
- `GET /products/:id` - Get product details (cached 30 minutes)
- `GET /products/:id/reviews` - Get product reviews with pagination (cached 1 hour, module scope)
- `GET /products/:id/related` - Get related products (cached 2 hours, global scope)
- `GET /categories/:id/products` - Get category products with sorting (cached 15 minutes, module scope)
- `GET /search?q=query&category=optional` - Search products (cached 5 minutes, global scope)

### Analytics Endpoints
- `GET /analytics/dashboard?period=7d` - Dashboard analytics (cached 30 minutes, global scope)
- `GET /analytics/products/:id?period=30d` - Product analytics (cached 1 hour, module scope)
- `GET /analytics/sales?start=2024-01-01&end=2024-01-05` - Sales analytics (cached 15 minutes, global scope)

### Notification Endpoints
- `GET /notifications/user/:userId?unread=false` - User notifications (cached 10 minutes, module scope)
- `POST /notifications/send` - Send notification (cached 5 minutes, global scope)
- `PUT /notifications/:id/read` - Mark notification as read (cached 3 minutes, module scope)

### Cache Management Endpoints
- `GET /cache/health` - Cache health check
- `GET /cache/patterns/:pattern` - Get cache keys by pattern
- `DELETE /cache/patterns/:pattern` - Delete cache keys by pattern
- `POST /cache/warm` - Cache warming with patterns
- `GET /cache/stats/detailed` - Detailed cache statistics

## Complex Caching Scenarios

### 1. **Multi-Scope Caching**
```typescript
// Global scope - shared across all modules
@Cacheable({ key: 'product', ttl: 1800, scope: 'global' })
async getProduct(id: string) { /* ... */ }

// Module scope - isolated per module
@Cacheable({ 
  key: 'product:reviews', 
  ttl: 3600, 
  scope: 'module',
  moduleName: 'EcommerceModule'
})
async getProductReviews(id: string, page: number) { /* ... */ }
```

### 2. **Variable TTL Strategies**
```typescript
// Short TTL for frequently changing data
@Cacheable({ key: 'search:products', ttl: 300 }) // 5 minutes

// Medium TTL for semi-static data
@Cacheable({ key: 'product', ttl: 1800 }) // 30 minutes

// Long TTL for static data
@Cacheable({ key: 'product:related', ttl: 7200 }) // 2 hours
```

### 3. **User-Specific Caching**
```typescript
@Cacheable({ 
  key: 'notifications:user', 
  ttl: 600, 
  scope: 'module',
  moduleName: 'NotificationModule'
})
async getUserNotifications(userId: string, unreadOnly: boolean) { /* ... */ }
```

### 4. **Complex Data Types**
```typescript
// Analytics with complex calculations
@Cacheable({ key: 'analytics:sales', ttl: 900 })
async getSalesAnalytics(start: string, end: string) {
  // Complex date range calculations
  // Aggregated data processing
  // Multiple data source integration
}
```

## Testing Advanced Scenarios

### 1. **E-commerce Workflow**
```bash
# Browse products
curl http://localhost:3001/products/1

# View product reviews
curl http://localhost:3001/products/1/reviews?page=1

# Find related products
curl http://localhost:3001/products/1/related

# Search for products
curl http://localhost:3001/search?q=iPhone&category=Electronics

# Browse by category
curl http://localhost:3001/categories/Electronics/products?sort=price
```

### 2. **Analytics Dashboard**
```bash
# Get dashboard analytics
curl http://localhost:3001/analytics/dashboard?period=7d

# Product-specific analytics
curl http://localhost:3001/analytics/products/1?period=30d

# Sales analytics with date range
curl "http://localhost:3001/analytics/sales?start=2024-01-01&end=2024-01-05"
```

### 3. **User Notifications**
```bash
# Get user notifications
curl http://localhost:3001/notifications/user/user1

# Get only unread notifications
curl http://localhost:3001/notifications/user/user1?unread=true

# Send a notification
curl -X POST http://localhost:3001/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "type": "promotion", "message": "Special offer!"}'

# Mark notification as read
curl -X PUT http://localhost:3001/notifications/1/read
```

### 4. **Advanced Cache Management**
```bash
# Check cache health
curl http://localhost:3001/cache/health

# Get cache by pattern
curl http://localhost:3001/cache/patterns/advanced:product:*

# Delete cache by pattern
curl -X DELETE http://localhost:3001/cache/patterns/advanced:analytics:*

# Warm cache with patterns
curl -X POST http://localhost:3001/cache/warm \
  -H "Content-Type: application/json" \
  -d '{"patterns": ["advanced:product:*", "advanced:analytics:*"]}'

# Get detailed cache statistics
curl http://localhost:3001/cache/stats/detailed
```

## Key Advanced Features

### 🔧 **Async Module Configuration**
```typescript
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

### 📊 **Complex Data Caching**
- **Analytics Data**: Multi-dimensional data with calculations
- **E-commerce Data**: Product catalogs, reviews, search results
- **User Data**: Personalized notifications and preferences
- **Aggregated Data**: Sales reports, dashboard metrics

### 🎯 **Smart Cache Management**
- **Pattern-based Operations**: Bulk operations on related keys
- **Health Monitoring**: Connection testing and status reporting
- **Cache Warming**: Pre-loading frequently accessed data
- **Detailed Analytics**: Key distribution and TTL analysis

### 🛡️ **Advanced Error Handling**
- **Graceful Degradation**: Fallback to original methods
- **Connection Resilience**: Retry logic with exponential backoff
- **Data Validation**: Input validation and error reporting
- **Performance Monitoring**: Response time tracking

## Performance Optimization

### 1. **TTL Strategy**
- **Short TTL (5-15 min)**: Search results, user-specific data
- **Medium TTL (30-60 min)**: Product data, analytics summaries
- **Long TTL (2+ hours)**: Static data, related products

### 2. **Scope Strategy**
- **Global Scope**: Shared data across modules
- **Module Scope**: Module-specific data isolation
- **User Scope**: Personalized data per user

### 3. **Key Naming Strategy**
- **Hierarchical Keys**: `module:entity:action`
- **Versioned Keys**: `v1:product:1`
- **Pattern-based Keys**: `search:query:category`

## Monitoring and Debugging

### Cache Health Monitoring
```bash
# Check cache health
curl http://localhost:3001/cache/health

# Expected response:
{
  "status": "healthy",
  "testValue": "ok",
  "totalKeys": 15,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Detailed Cache Statistics
```bash
curl http://localhost:3001/cache/stats/detailed

# Shows:
# - Total keys by pattern
# - Keys by module scope
# - TTL distribution analysis
# - Memory usage patterns
```

### Pattern-based Cache Management
```bash
# View all product-related cache
curl http://localhost:3001/cache/patterns/advanced:product:*

# Clear all analytics cache
curl -X DELETE http://localhost:3001/cache/patterns/advanced:analytics:*
```

## Troubleshooting

### Common Issues

1. **Redis Connection Issues**
   ```bash
   # Check Redis connection
   redis-cli ping
   
   # Verify environment variables
   echo $REDIS_URL
   ```

2. **Cache Performance Issues**
   - Monitor cache hit rates
   - Adjust TTL values based on data volatility
   - Use appropriate key scoping
   - Implement cache warming strategies

3. **Memory Usage**
   - Monitor detailed cache stats
   - Implement cache eviction policies
   - Use pattern-based cleanup

### Debug Mode
```bash
# Enable debug logging
export DEBUG=nestjs-redis-cache:*

# Run with debug output
npm run dev
```

## Next Steps

- Implement cache invalidation strategies
- Add cache warming on application startup
- Implement cache compression for large objects
- Add cache performance metrics and monitoring
- Implement cache clustering for high availability
- Add cache backup and recovery mechanisms 
