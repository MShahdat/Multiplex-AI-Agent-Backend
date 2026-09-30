import { BadRequestException, Body, Controller, Get, Headers, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service.js';
import { prefix } from '../../utils/global.prefix.js';
import { SubscriptionDto } from './subscription.dto.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PaymentMethod, Role } from '../../../../generated/prisma/enums.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import type { Response } from 'express';
import type { IQuery } from '../../interface/index.js';
import type { RawBodyRequest } from '@nestjs/common'


@ApiTags('Subscription')
@Controller(`${prefix}/subscription`)
export class SubscriptionController {

  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create subscription (USER only): BKASH → payment URL, CARD → Stripe checkout' })
  @ApiBody({ type: SubscriptionDto })
  @ApiResponse({ status: 201, description: 'Payment url / Checkout session created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: USER only' })
  async subscriptionCreate(
    @Body() payload: SubscriptionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {

    if (payload.method === PaymentMethod.BKASH) {
      const res = await this.subscriptionService.subscription(payload, user)
      return {
        data: res,
        message: "Payment url created successfully"
      }
    } else {
      const res = await this.subscriptionService.createCheckoutSession(payload, user)

      return {
        data: res,
        message: 'Checkout session created successfully'
      }
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


  @Post('/webhook')
  async stripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() request: RawBodyRequest<Request>,
  ) {

    if (!signature || !request.rawBody) {
      throw new BadRequestException('Missing Stripe signature or raw request body');
    }

    await this.subscriptionService.stripeWebhook(signature, request.rawBody);
    return {
      data: {
        received: true
      },
      message: 'Stripe webhook received'
    };
  }


  @Get('/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Admin paginated list + meta (ADMIN only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 9 })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'CANCELED', 'EXPIRED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['MONTHLY', 'HALF_YEARLY', 'YEARLY'] })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully. Envelope includes meta{total,page,limit,totalPages}.' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  async getAllSubscriptions(@Query() query: IQuery) {
    const res = await this.subscriptionService.getAllSubscription(query)

    return {
      data: res.subscription,
      meta: res.meta,
      message: 'Subscriptions retrieved successfully',
    }
  }

  @Get('/my')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Own subscriptions paginated (PAID only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 9 })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'CANCELED', 'EXPIRED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['MONTHLY', 'HALF_YEARLY', 'YEARLY'] })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'My subscriptions retrieved successfully' })
  async getMySubscription(
    @Query() query: IQuery,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.subscriptionService.getMySubscription(query, user)
    return {
      data: res.subscription,
      meta: res.meta,
      message: 'My subscriptions retrieved successfully',
    }
  }


}
