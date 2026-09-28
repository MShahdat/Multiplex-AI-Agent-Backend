import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { prefix } from '../../utils/global.prefix.js';
import { MsgPromptDto } from './message.dto.js';
import { MessageService } from './message.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../interface/index.js';

@Controller(`${prefix}/message`)
export class MessageController {

  constructor(private readonly messageService: MessageService) { }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async message(
    @Body() payload: MsgPromptDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const res = await this.messageService.createMsg(payload, user);
    return {
      data: res,
      message: "success"
    };
  }
}
