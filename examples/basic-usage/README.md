# NestJS Redis Cache - Basic Usage Example

This example demonstrates how to use the `nestjs-redis-cache` package in a real NestJS application.

## Features Demonstrated

- ✅ **Module Configuration**: Both sync and async module setup
- ✅ **@Cacheable Decorator**: Explicit caching with different TTLs and scopes
- ✅ **RedisService**: Direct Redis operations
- ✅ **Key Generation**: Global and module-level key scoping
- ✅ **Error Handling**: Graceful fallbacks and error management
- ✅ **Cache Management**: Stats, clearing, and manual cache operations

## Prerequisites

- Node.js (v16 or higher)
- Redis server running locally or accessible via URL
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   cd examples/basic-usage
   npm install
   ```

2. **Start Redis server:**
   ```bash
   # If you have Redis installed locally
   redis-server
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

3. **Set environment variables (optional):**
   ```bash
   export REDIS_URL=redis://localhost:6379
   export PORT=3000
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

### Basic Endpoints
- `GET /` - Hello message
- `GET /users/:id` - Get user (cached for 5 minutes)
- `GET /users/:id/profile` - Get user profile (cached for 10 minutes, module scope)
- `GET /products/:id` - Get product (cached for 3 minutes)
- `GET /products/:id/details` - Get product details (cached for 15 minutes)

### Cache Management
- `GET /cache/stats` - Get cache statistics
- `GET /cache/keys` - List all cache keys
- `DELETE /cache/clear` - Clear all cache
- `POST /cache/set` - Set a cache key manually
- `GET /cache/get/:key` - Get a cache key manually

## Testing the Caching

### 1. Test User Caching
```bash
# First request (cache miss)
curl http://localhost:3000/users/1

# Second request (cache hit - should be faster)
curl http://localhost:3000/users/1

# Check cache stats
curl http://localhost:3000/cache/stats
```

### 2. Test Product Caching
```bash
# First request (cache miss)
curl http://localhost:3000/products/1

# Second request (cache hit)
curl http://localhost:3000/products/1

# Get product details
curl http://localhost:3000/products/1/details
```

### 3. Test Manual Cache Operations
```bash
# Set a custom cache key
curl -X POST http://localhost:3000/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key": "custom:data", "value": {"message": "Hello from cache!"}, "ttl": 60}'

# Get the custom cache key
curl http://localhost:3000/cache/get/custom:data

# Clear all cache
curl -X DELETE http://localhost:3000/cache/clear
```

## Caching Scenarios Demonstrated

### 1. **Global Scope Caching**
```typescript
@Cacheable({ key: 'user', ttl: 300 })
async getUser(id: string) {
  // This will be cached globally
}
```

### 2. **Module Scope Caching**
```typescript
@Cacheable({ 
  key: 'user:profile', 
  ttl: 600, 
  scope: 'module',
  moduleName: 'UserModule'
})
async getUserProfile(id: string) {
  // This will be cached with module prefix
}
```

### 3. **Different TTL Values**
- User data: 5 minutes (300 seconds)
- User profiles: 10 minutes (600 seconds)
- Product data: 3 minutes (180 seconds)
- Product details: 15 minutes (900 seconds)

### 4. **Direct Redis Operations**
```typescript
// Get cache statistics
const stats = await this.redisService.keys('*');

// Clear all cache
await this.redisService.flushAll();

// Set custom cache
await this.redisService.set('custom:key', data, 60);
```

## Key Features Highlighted

### 🔄 **Automatic Cache Management**
- Cache hits return immediately
- Cache misses execute the method and cache the result
- Automatic TTL management
- Graceful error handling with fallback to original method

### 🏷️ **Smart Key Generation**
- Global scope: `user`, `product`
- Module scope: `UserModule:user:profile`
- Custom prefixes: `example:user`

### 📊 **Cache Monitoring**
- Real-time cache statistics
- Key listing and inspection
- Manual cache operations

### 🛡️ **Error Handling**
- Redis connection errors are logged
- Method execution errors fallback to original method
- Invalid configurations show clear error messages

## Expected Behavior

1. **First Request**: Cache miss, method executes, result cached
2. **Subsequent Requests**: Cache hit, immediate response
3. **After TTL Expiry**: Cache miss, method executes again
4. **Redis Down**: Fallback to original method execution
5. **Invalid Data**: Graceful error handling with logging

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Should return PONG
```

### Cache Not Working
1. Check Redis connection
2. Verify cache keys in `/cache/keys`
3. Check cache stats in `/cache/stats`
4. Clear cache with `/cache/clear`

### Performance Issues
1. Monitor cache hit rates
2. Adjust TTL values based on data volatility
3. Use appropriate key scoping
4. Consider cache warming strategies

## Next Steps

- Try different TTL values
- Experiment with module vs global scoping
- Test error scenarios (Redis down, invalid data)
- Implement cache warming strategies
- Add cache invalidation patterns 
