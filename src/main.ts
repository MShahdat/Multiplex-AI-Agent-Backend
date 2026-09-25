import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import config from './app/config/index.js';
import { prisma } from './app/lib/prisma.js';
import { redisClient } from './app/lib/redis.js';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './app/common/interceptors/response.interceptor.js';
import cookieParser from "cookie-parser";


const PORT = config.port || 5000;

async function bootstrap() {
  try {

    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.enableCors({
      origin: config.frontend_url,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      }),
    );

    app.useGlobalInterceptors(
      new ResponseInterceptor
    )

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
