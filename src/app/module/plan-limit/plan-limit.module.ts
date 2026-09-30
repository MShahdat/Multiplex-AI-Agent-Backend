import { Module } from '@nestjs/common';
import { PlanLimitController } from './plan-limit.controller.js';
import { PlanLimitService } from './plan-limit.service.js';

@Module({
  controllers: [PlanLimitController],
  providers: [PlanLimitService]
})
export class PlanLimitModule {}
