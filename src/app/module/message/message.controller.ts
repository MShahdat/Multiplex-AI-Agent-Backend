import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { prefix } from '../../utils/global.prefix.js';
import { MsgPromptDto, UpdateTitleDto } from './message.dto.js';
import { MessageService } from './message.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../interface/index.js';

@ApiTags('Message')
@Controller(`${prefix}/message`)
export class MessageController {

  constructor(private readonly messageService: MessageService) { }

  //& CREATE CHAT
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Send prompt to Groq (premium gate: ACTIVE PREMIUM for premium models)' })
  @ApiBody({ type: MsgPromptDto })
  @ApiResponse({ status: 201, description: 'Chat created. Auto-titles new conversations (45 chars).' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active premium subscription required' })
  @ApiResponse({ status: 404, description: 'Model not found' })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List own conversations with messages' })
  @ApiResponse({ status: 200, description: 'My conversation retrive successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get single conversation (ownership-checked)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrive Successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update conversation title' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiBody({ type: UpdateTitleDto })
  @ApiResponse({ status: 200, description: 'Title updated Successfully' })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Archive conversation (isArchived=true)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation archieved Successfully' })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Un-archive conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation undo from acrchieved Successfully' })
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
