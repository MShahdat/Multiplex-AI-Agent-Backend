import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { prefix } from '../../utils/global.prefix.js';
import { PlanLimitService } from './plan-limit.service.js';
import { CreatePlanLimitDto, UPdatePlanLimitDto } from './plan-limit.dto.js';
import type { IQuery } from '../../interface/index.js';

@ApiTags('PlanLimits')
@Controller(`${prefix}/plan-limits`)
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
@ApiCookieAuth('accessToken')
export class PlanLimitController {
  constructor(private readonly planService: PlanLimitService) { }

  //& GET ALL
  @Get()
  @ApiOperation({ summary: 'List limit rows ?planTemplateId&aiProviderId (ADMIN)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'planTemplateId', required: false })
  @ApiQuery({ name: 'aiProviderId', required: false })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  async getAll(
    @Query() query: IQuery
  ) {

    const res = await this.planService.getAll(query)

    return {
      data: res.limits,
      meta: res.meta,
      message: 'All limits retrieved successfully',
    };
  }


  //& GET SINGLE
  @Get('/:id')
  @ApiOperation({ summary: 'Get single limit row (ADMIN)' })
  async getOne(@Param('id') id: string) {

    const res = await this.planService.getOne(id)
    return {
      data: res,
      message: 'Limit retrieved successfully',
    };

  }
  //& CREATE
  @Post()
  @ApiOperation({ summary: 'Create limit row with manual quotas (ADMIN). 409 if pair exists.' })
  @ApiResponse({ status: 201, description: 'Limit created successfully' })
  @ApiResponse({ status: 404, description: 'Template or provider missing' })
  @ApiResponse({ status: 409, description: 'Pair already exists' })
  async create(
    @Body() payload: CreatePlanLimitDto
  ) {

    const res = await this.planService.create(payload)
    return {
      data: res,
      message: 'All limits retrieved successfully',
    };
  }

  //& UPDATE
  @Put('/update')
  @ApiOperation({ summary: 'Create or replace limit row (ADMIN idempotent)' })
  async upsert(
    @Body() payload: CreatePlanLimitDto
  ) {
    const res = await this.planService.upsert(payload)
    return {
      data: res,
      message: 'Limit update successfully',
    };

  }
}
