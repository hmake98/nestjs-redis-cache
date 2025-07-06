import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for demo purposes
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Cache stats: http://localhost:${port}/cache/stats`);
  console.log(`🗑️  Clear cache: DELETE http://localhost:${port}/cache/clear`);
  console.log(`📝 Set cache: POST http://localhost:${port}/cache/set`);
  console.log(`🔍 Get cache: GET http://localhost:${port}/cache/get/:key`);
  console.log(`👥 Users: http://localhost:${port}/users/1`);
  console.log(`📦 Products: http://localhost:${port}/products/1`);
}
bootstrap();
