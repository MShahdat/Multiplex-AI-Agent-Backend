import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CreateProviderDto } from './provider.dto.js';
import { ProviderService } from './provider.service.js';
import { prefix } from '../../utils/global.prefix.js';

@Controller(`${prefix}/provider`)
export class ProviderController {

  constructor(private readonly providerService: ProviderService) { }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(
    @Body() payload: CreateProviderDto
  ) {
    const result = await this.providerService.create(payload)

    return {
      data: result,
      message: "Provider created successfully"
    }
  }
}
