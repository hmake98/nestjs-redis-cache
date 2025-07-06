import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { EcommerceService } from './ecommerce.service';
import { AnalyticsService } from './analytics.service';
import { NotificationService } from './notification.service';
import { RedisService } from '../../../src/services/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ecommerceService: EcommerceService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // E-commerce endpoints
  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.ecommerceService.getProduct(id);
  }

  @Get('products/:id/reviews')
  async getProductReviews(@Param('id') id: string, @Query('page') page = '1') {
    return this.ecommerceService.getProductReviews(id, parseInt(page));
  }

  @Get('products/:id/related')
  async getRelatedProducts(@Param('id') id: string) {
    return this.ecommerceService.getRelatedProducts(id);
  }

  @Get('categories/:id/products')
  async getCategoryProducts(
    @Param('id') id: string,
    @Query('sort') sort = 'name',
  ) {
    return this.ecommerceService.getCategoryProducts(id, sort);
  }

  @Get('search')
  async searchProducts(
    @Query('q') query: string,
    @Query('category') category?: string,
  ) {
    return this.ecommerceService.searchProducts(query, category);
  }

  // Analytics endpoints
  @Get('analytics/dashboard')
  async getDashboardAnalytics(@Query('period') period = '7d') {
    return this.analyticsService.getDashboardAnalytics(period);
  }

  @Get('analytics/products/:id')
  async getProductAnalytics(
    @Param('id') id: string,
    @Query('period') period = '30d',
  ) {
    return this.analyticsService.getProductAnalytics(id, period);
  }

  @Get('analytics/sales')
  async getSalesAnalytics(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.analyticsService.getSalesAnalytics(start, end);
  }

  // Notification endpoints
  @Get('notifications/user/:userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('unread') unread = 'false',
  ) {
    return this.notificationService.getUserNotifications(
      userId,
      unread === 'true',
    );
  }

  @Post('notifications/send')
  async sendNotification(
    @Body() body: { userId: string; type: string; message: string },
  ) {
    return this.notificationService.sendNotification(
      body.userId,
      body.type,
      body.message,
    );
  }

  @Put('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  // Cache management endpoints
  @Get('cache/health')
  async getCacheHealth() {
    try {
      // Test basic Redis operations
      await this.redisService.set('health:test', 'ok', 10);
      const testValue = await this.redisService.get('health:test');
      await this.redisService.del('health:test');

      const allKeys = await this.redisService.keys('*');

      return {
        status: 'healthy',
        testValue,
        totalKeys: allKeys.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        { status: 'unhealthy', error: error.message },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('cache/patterns/:pattern')
  async getCacheByPattern(@Param('pattern') pattern: string) {
    const keys = await this.redisService.keys(pattern);
    const results = [];

    for (const key of keys.slice(0, 20)) {
      // Limit to first 20 keys
      const value = await this.redisService.get(key);
      const ttl = await this.redisService.ttl(key);
      results.push({ key, value, ttl });
    }

    return {
      pattern,
      totalKeys: keys.length,
      sampleKeys: results,
    };
  }

  @Delete('cache/patterns/:pattern')
  async deleteCacheByPattern(@Param('pattern') pattern: string) {
    const keys = await this.redisService.keys(pattern);
    let deletedCount = 0;

    for (const key of keys) {
      await this.redisService.del(key);
      deletedCount++;
    }

    return {
      pattern,
      deletedKeys: deletedCount,
      message: `Deleted ${deletedCount} keys matching pattern: ${pattern}`,
    };
  }

  @Post('cache/warm')
  async warmCache(@Body() body: { patterns: string[] }) {
    const results = [];

    for (const pattern of body.patterns) {
      const keys = await this.redisService.keys(pattern);
      results.push({ pattern, keysFound: keys.length });
    }

    return {
      message: 'Cache warming initiated',
      results,
    };
  }

  @Get('cache/stats/detailed')
  async getDetailedCacheStats() {
    const allKeys = await this.redisService.keys('*');
    const stats = {
      totalKeys: allKeys.length,
      byPattern: {} as Record<string, number>,
      byModule: {} as Record<string, number>,
      byTTL: {} as Record<string, number>,
    };

    // Analyze keys by pattern
    for (const key of allKeys) {
      const parts = key.split(':');
      const pattern = parts[0];
      const module = parts[1] || 'global';

      stats.byPattern[pattern] = (stats.byPattern[pattern] || 0) + 1;
      stats.byModule[module] = (stats.byModule[module] || 0) + 1;
    }

    // Sample TTL analysis
    for (const key of allKeys.slice(0, 50)) {
      const ttl = await this.redisService.ttl(key);
      const ttlRange =
        ttl < 0
          ? 'no-expiry'
          : ttl < 60
            ? 'under-1min'
            : ttl < 300
              ? '1-5min'
              : ttl < 3600
                ? '5min-1hour'
                : 'over-1hour';
      stats.byTTL[ttlRange] = (stats.byTTL[ttlRange] || 0) + 1;
    }

    return stats;
  }
}
