import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { prefix } from '../../utils/global.prefix.js';
import { SubscriptionDto } from './subscription.dto.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import type { Response } from 'express';


@Controller(`${prefix}/subscription`)
export class SubscriptionController {

  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.USER)
  async subscriptionCreate(
    @Body() payload: SubscriptionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {

    const res = await this.subscriptionService.subscription(payload, user)

    return {
      data: res,
      message: "Payment url created successfully"
    }
  }


  @Get('/bkash/callback')
  async bkashCallback(
    @Query() query: Record<string, any>,
    @Res() response: Response,
  ) {

    const result = await this.subscriptionService.bKashCallback(query)

    return response.redirect(302, result.redirectUrl)
  }

}
