import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CreateProviderDto, UpdateProviderDto } from './provider.dto.js';
import { ProviderService } from './provider.service.js';
import { prefix } from '../../utils/global.prefix.js';

@ApiTags('Provider')
@Controller(`${prefix}/provider`)
export class ProviderController {

  constructor(private readonly providerService: ProviderService) { }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create provider from preset whitelist with manual fields (ADMIN)' })
  async create(
    @Body() payload: CreateProviderDto
  ) {
    const res = await this.providerService.create(payload)
    return {
      data: res,
      message: 'Provider created successfully'
    };
  }


  @Patch('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Edit provider flags / rotate key (ADMIN)' })
  async patchDetails(
    @Param('id') id: string,
    @Body() payload: UpdateProviderDto) {

    const res = await this.providerService.updateModel(payload, id)

    return {
      data: res,
      message: 'Provider updated successfully'
    };
  }

  //& GET ALL MODEL (ADMIN)
  @Get('/all-model')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Admin list all providers incl. disabled/premium' })
  @ApiResponse({ status: 200, description: 'All model retrive successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  async getAllModel() {

    const res = await this.providerService.getAllModel()

    return {
      data: res,
      message: "All model retrive successfully"
    }
  }

  //& GET ALL (PUBLIC)
  @Get()
  // @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Public list enabled models (?search, ?isPremium passthrough)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by model/name' })
  @ApiQuery({ name: 'isPremium', required: false, description: 'Filter true/false' })
  @ApiResponse({ status: 200, description: 'All model retrive successfully' })
  async getAll(
    @Query() query: Record<string, any>
  ) {
    const res = await this.providerService.getModels(query)

    return {
      data: res,
      message: res.length !== 0 ? "All model retrive successfully" : "Model not found!"
    }
  }

}
