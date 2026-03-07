import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(port);
  console.log(`🚀 Poker Friends server running on port ${port}`);
}
bootstrap();
