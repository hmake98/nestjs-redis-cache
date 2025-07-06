import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EcommerceService } from './ecommerce.service';
import { AnalyticsService } from './analytics.service';
import { NotificationService } from './notification.service';
import { CachingModule } from '../../../src/caching.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CachingModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redisUrl: configService.get('REDIS_URL') || 'redis://localhost:6379',
        keyPrefix: configService.get('CACHE_PREFIX') || 'advanced:',
        maxRetries: configService.get('REDIS_MAX_RETRIES') || 3,
        retryDelay: configService.get('REDIS_RETRY_DELAY') || 1000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EcommerceService,
    AnalyticsService,
    NotificationService,
  ],
})
export class AppModule {}
