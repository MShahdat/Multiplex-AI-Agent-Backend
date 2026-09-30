import { Module } from '@nestjs/common';
import { PlanTemplateController } from './plan-template.controller.js';
import { PlanTemplateService } from './plan-template.service.js';

@Module({
  controllers: [PlanTemplateController],
  providers: [PlanTemplateService]
})
export class PlanTemplateModule {}
