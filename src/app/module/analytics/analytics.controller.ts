import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { prefix } from '../../utils/global.prefix.js';

@ApiTags('Analytics')
@Controller(`${prefix}/analytics`)
export class AnalyticsController {

  constructor(private readonly analyticsService: AnalyticsService) { }


  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Admin dashboard aggregates (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrive successfully: totalUsers, providers, subscriptions, revenue' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  async analytics() {

    const res = await this.analyticsService.analytics()

    return {
      data: res,
      message: "Analytics retrive successfully"
    }

  }
}
