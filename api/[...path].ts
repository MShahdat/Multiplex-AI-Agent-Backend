import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import type { Request, Response } from 'express';
import { AppModule } from '../src/app.module.js';
import config from '../src/app/config/index.js';
import { ResponseInterceptor } from '../src/app/common/interceptors/response.interceptor.js';
import { prisma } from '../src/app/lib/prisma.js';
import { redisClient } from '../src/app/lib/redis.js';

type ExpressHandler = (req: Request, res: Response) => void;

let appPromise: Promise<ExpressHandler> | undefined;

async function createHandler(): Promise<ExpressHandler> {
  const app = await NestFactory.create(AppModule, { rawBody: true });

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
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());

  await prisma.$connect();
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  await app.init();

  return app.getHttpAdapter().getInstance() as ExpressHandler;
}

export default async function handler(req: Request, res: Response) {
  appPromise ??= createHandler();
  const expressHandler = await appPromise;
  return expressHandler(req, res);
}