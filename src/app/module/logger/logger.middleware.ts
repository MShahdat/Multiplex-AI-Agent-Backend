
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import type { AuthenticatedUser } from '../../interface/index.js';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request & { user?: AuthenticatedUser }, res: Response, next: NextFunction) {
    const start = Date.now();

    const apiEndpoint = req.originalUrl?.split('?')[0] ?? req.url;
    const method = req.method;

    res.on('finish', () => {
      void (async () => {
        try {
          const latency = Date.now() - start;
          const userId = req.user?.id ?? null;

          await prisma.requestsLog.create({
            data: {
              apiEndpoint,
              method,
              latency,
              statusCode: res.statusCode,
              message: null,
              userId,
            },
          });
        } catch (err) {
          console.error('[RequestsLog] failed to persist:', err);
        }
      })();
    });

    next();
  }
}