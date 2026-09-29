import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { prefix } from '../../utils/global.prefix.js';
import { MsgPromptDto, UpdateTitleDto } from './message.dto.js';
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

  //& CREATE CHAT
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


  //& GET MY CONVERSATION
  @Get('/my-conversation')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async getMyConversation(
    @CurrentUser() user: AuthenticatedUser
  ) {

    const res = await this.messageService.getMyConversation(user)

    return {
      data: res,
      message: 'My conversation retrive successfully'
    }
  }


  //& GET BY ID
  @Get('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async getSingleConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    const res = await this.messageService.getSingleConversation(id, user);
    return {
      data: res,
      message: "Conversation retrive Successfully"
    };
  }



  //& UDPATE TITLE
  @Put('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async updateTitle(
    @Body() payload: UpdateTitleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    const res = await this.messageService.updateTitle(payload, id, user);
    return {
      data: res,
      message: "Title updated Successfully"
    };
  }


  //& ARCHIVED
  @Patch('/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async archieve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    await this.messageService.archive(id, user);
    return {
      data: null,
      message: "Conversation archieved Successfully"
    };
  }


  //& REMOVED FROM ARCHIVED
  @Patch('/remove/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async removeArchieve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    const res = await this.messageService.removeArchive(id, user);
    return {
      data: null,
      message: "Conversation undo from acrchieved Successfully"
    };
  }




}
