import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { prefix } from '../../utils/global.prefix.js';
import { PlanTemplateService } from './plan-template.service.js';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../../generated/prisma/enums.js';
import { CreatePlanTemplateDto, UpdatePlanTemplateDto } from './plan-template.dto.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';


@ApiTags('Plan Template')
@Controller(`${prefix}/plan-template`)
export class PlanTemplateController {

  constructor(private readonly planTemplateService: PlanTemplateService) { }

  @Get()
  @ApiOperation({ summary: 'Public pricing list' })
  async getAll() {

    const res = await this.planTemplateService.getAll()

    return {
      data: res,
      message: "All templates retrived successfully"
    }
  }


  @Get('/:id')
  @ApiOperation({ summary: 'Get single template' })
  async getOne(@Param('id') id: string) {
    const res = await this.planTemplateService.getOne(id)

    return {
      data: res,
      message: 'Template retrieved successfully'
    };
  }




  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create template with manual price (ADMIN)' })
  async create(
    @Body() payload: CreatePlanTemplateDto
  ) {
    const res = await this.planTemplateService.create(payload)

    return {
      data: res,
      message: 'template created successfully'
    }
  }



  @Patch('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update price / isActive / code (ADMIN)' })
  async updateTem(
    @Param('id') id: string,
    @Body() payload: UpdatePlanTemplateDto
  ) {

    if (!payload.code && !payload.isActive && !payload.price) {
      throw new BadRequestException('Must be one field')
    }
    const res = await this.planTemplateService.update(payload, id)
    return {
      data: res,
      message: "Template updated successfully"
    }
  }

}