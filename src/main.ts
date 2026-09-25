import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import config from './app/config/index.js';
import { prisma } from './app/lib/prisma.js';
import { redisClient } from './app/lib/redis.js';
import { ValidationPipe } from '@nestjs/common';

const PORT = config.port || 5000;

async function bootstrap() {
  try {
    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await prisma.$connect();
    console.log('Connected to the database successfully.');

    await redisClient.connect();
    console.log('Connected to Redis successfully.');

    await app.listen(PORT, () => {
      console.log(`server is running port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
    await prisma.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    process.exit(1);
  }
}
await bootstrap();
