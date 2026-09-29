import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { prefix } from '../../utils/global.prefix.js';

@Controller(`${prefix}/analytics`)
export class AnalyticsController {

  constructor(private readonly analyticsService: AnalyticsService) { }


  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async analytics() {

    const res = await this.analyticsService.analytics()

    return {
      data: res,
      message: "Analytics retrive successfully"
    }

  }
}
