import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for demo purposes
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(
    `🚀 Advanced Application is running on: http://localhost:${port}`,
  );
  console.log(`📊 Cache health: http://localhost:${port}/cache/health`);
  console.log(
    `📈 Dashboard analytics: http://localhost:${port}/analytics/dashboard`,
  );
  console.log(`🛍️  Product search: http://localhost:${port}/search?q=iPhone`);
  console.log(`📱 Product details: http://localhost:${port}/products/1`);
  console.log(
    `🔔 User notifications: http://localhost:${port}/notifications/user/user1`,
  );
  console.log(
    `📊 Detailed cache stats: http://localhost:${port}/cache/stats/detailed`,
  );
}
bootstrap();
