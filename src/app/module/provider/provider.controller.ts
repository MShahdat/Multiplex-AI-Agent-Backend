import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UpdateProviderDto } from './provider.dto.js';
import { ProviderService } from './provider.service.js';
import { prefix } from '../../utils/global.prefix.js';

@ApiTags('Provider')
@Controller(`${prefix}/provider`)
export class ProviderController {

  constructor(private readonly providerService: ProviderService) { }


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


  //& UPDATE (ADMIN)
  @Put('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Enable model (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Model Enabled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async update(
    @Param('id') id: string
  ) {

    await this.providerService.updateModel(id)

    return {
      data: null,
      message: "Model Enabled successfully"
    }
  }

  //& DISABLE (ADMIN)
  @Patch('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Disable model (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Model Disabled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async disableModel(
    @Param('id') id: string
  ) {

    await this.providerService.disableModel(id)

    return {
      data: null,
      message: "Model Disabled successfully"
    }
  }


}
