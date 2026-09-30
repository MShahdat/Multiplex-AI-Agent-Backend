import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthenticatedUser, IQuery } from '../../interface/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { prefix } from '../../utils/global.prefix.js';

@ApiTags('Payment')
@Controller(`${prefix}/payment`)
export class PaymentController {

  constructor(private readonly paymentService: PaymentService) { }

  @Get('/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Admin paginated list of all payments (ADMIN only)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by payment id, user name, or email' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 9 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'] })
  @ApiQuery({ name: 'method', required: false, enum: ['CARD', 'BKASH'] })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'All payments retrieved successfully. Envelope includes meta{total,page,limit,totalPages}.' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  async allPayments(
    @Query() query: IQuery
  ) {

    const res = await this.paymentService.getAllPayments(query)

    return {
      data: res.payment,
      meta: res.meta,
      message: 'All payments retrieved successfully'
    }
  }


  //& MY PAYMENTS
  @Get('/my')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get my payments (USER only)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by payment id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 9 })
  @ApiQuery({ name: 'method', required: false, enum: ['CARD', 'BKASH'] })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'My payments retrieved successfully. Envelope includes meta{total,page,limit,totalPages}.' })
  @ApiResponse({ status: 403, description: 'Forbidden: USER only' })
  async myPayments(
    @Query() query: IQuery,
    @CurrentUser() user: AuthenticatedUser
  ) {

    const res = await this.paymentService.getMyPayments(query, user)

    return {
      data: res.payment,
      meta: res.meta,
      message: 'My payments retrieved successfully'
    }
  }


}
