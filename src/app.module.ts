import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AuthModule } from './app/module/auth/auth.module.js';
import { UserModule } from './app/module/user/user.module.js';
import { ProviderModule } from './app/module/provider/provider.module.js';
import { MessageModule } from './app/module/message/message.module.js';
import { SubscriptionModule } from './app/module/subscription/subscription.module.js';
import { AnalyticsModule } from './app/module/analytics/analytics.module.js';
import { LoggerModule } from './app/module/logger/logger.module.js';


@Module({
  controllers: [AppController],
  imports: [AuthModule, UserModule, ProviderModule, MessageModule, SubscriptionModule, AnalyticsModule, LoggerModule],
})
export class AppModule { }
