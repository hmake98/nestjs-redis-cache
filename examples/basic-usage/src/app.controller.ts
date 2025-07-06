import { Controller, Get, Post, Param, Body, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user.service';
import { ProductService } from './product.service';
import { RedisService } from '../../../src/services/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly productService: ProductService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Get('users/:id/profile')
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getUserProfile(id);
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.productService.getProduct(id);
  }

  @Get('products/:id/details')
  async getProductDetails(@Param('id') id: string) {
    return this.productService.getProductDetails(id);
  }

  @Get('cache/stats')
  async getCacheStats() {
    const keys = await this.redisService.keys('*');
    const stats = {
      totalKeys: keys.length,
      keys: keys.slice(0, 10), // Show first 10 keys
    };
    return stats;
  }

  @Get('cache/keys')
  async getAllKeys() {
    return await this.redisService.keys('*');
  }

  @Delete('cache/clear')
  async clearCache() {
    await this.redisService.flushAll();
    return { message: 'Cache cleared successfully' };
  }

  @Post('cache/set')
  async setCacheKey(@Body() body: { key: string; value: any; ttl?: number }) {
    await this.redisService.set(body.key, body.value, body.ttl);
    return { message: 'Key set successfully' };
  }

  @Get('cache/get/:key')
  async getCacheKey(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    return { key, value };
  }
}
