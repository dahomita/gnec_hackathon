import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add global prefix to all endpoints
  app.setGlobalPrefix('api');
  
  // Enable CORS
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
