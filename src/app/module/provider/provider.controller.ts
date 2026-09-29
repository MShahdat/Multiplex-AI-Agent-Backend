import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UpdateProviderDto } from './provider.dto.js';
import { ProviderService } from './provider.service.js';
import { prefix } from '../../utils/global.prefix.js';

@Controller(`${prefix}/provider`)
export class ProviderController {

  constructor(private readonly providerService: ProviderService) { }


  @Get('/all-model')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllModel() {

    const res = await this.providerService.getAllModel()

    return {
      data: res,
      message: "All model retrive successfully"
    }
  }

  @Get()
  // @UseGuards(AuthGuard)
  async getAll(
    @Query() query: Record<string, any>
  ) {
    const res = await this.providerService.getModels(query)

    return {
      data: res,
      message: res.length !== 0 ? "All model retrive successfully" : "Model not found!"
    }
  }


  @Put('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string
  ) {

    await this.providerService.updateModel(id)

    return {
      data: null,
      message: "Model Enabled successfully"
    }
  }

  @Patch('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
