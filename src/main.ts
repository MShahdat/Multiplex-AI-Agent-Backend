import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import config from './app/config/index.js';
import { prisma } from './app/lib/prisma.js';
import { redisClient } from './app/lib/redis.js';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './app/common/interceptors/response.interceptor.js';
import cookieParser from "cookie-parser";
import passport from 'passport';
import { freeTemplate, planProviderLimits, premiumTemplates, providers, seedTesterAdmin } from './app/utils/seed.js';
import { deleteSubscriptionPaymentFromDB, deleteUserFromDB } from './app/lib/cron.js';
import { setupSwagger } from './app/docs/swagger.config.js';


const PORT = config.port || 5000;

async function bootstrap() {
  try {

    const app = await NestFactory.create(AppModule, {
      rawBody: true
    });

    app.use(cookieParser());
    app.use(passport.initialize());

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

    setupSwagger(app);

    await prisma.$connect();
    console.log('Connected to the database successfully.');

    await redisClient.connect();
    console.log('Connected to Redis successfully.');

    await seedTesterAdmin()

    await freeTemplate()
    await premiumTemplates()
    await providers()
    await planProviderLimits()

    await deleteUserFromDB()
    await deleteSubscriptionPaymentFromDB()

    await app.listen(PORT, () => {
      console.log(`server is running port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
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
