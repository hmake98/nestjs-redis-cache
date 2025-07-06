import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserService } from './user.service';
import { ProductService } from './product.service';
import { CachingModule } from '../../../src/caching.module';

@Module({
  imports: [
    CachingModule.forRoot({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: 'example:',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, UserService, ProductService],
})
export class AppModule {}
