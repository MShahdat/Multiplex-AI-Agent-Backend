import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { RequestLoggerMiddleware } from './logger.middleware.js';


@Module({})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      // .exclude(
      //   { path: 'api/v1/subscription/webhook', method: RequestMethod.ALL },
      // )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}