import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AuthModule } from './app/module/auth/auth.module.js';
import { UserModule } from './app/module/user/user.module.js';
import { ProviderModule } from './app/module/provider/provider.module.js';
import { MessageModule } from './app/module/message/message.module.js';
import { SubscriptionModule } from './app/module/subscription/subscription.module.js';
import { AnalyticsModule } from './app/module/analytics/analytics.module.js';
import { LoggerModule } from './app/module/logger/logger.module.js';
import { PaymentModule } from './app/module/payment/payment.module.js';
import { PlanTemplateModule } from './app/module/plan-template/plan-template.module.js';
import { PlanLimitModule } from './app/module/plan-limit/plan-limit.module.js';


@Module({
  controllers: [AppController],
  imports: [AuthModule, UserModule, ProviderModule, MessageModule, SubscriptionModule, AnalyticsModule, LoggerModule, PaymentModule, PlanTemplateModule, PlanLimitModule],
})
export class AppModule { }
