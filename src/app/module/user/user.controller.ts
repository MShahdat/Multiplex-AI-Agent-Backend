import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Patch,
  Body,
  Param
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { prefix } from '../../utils/global.prefix.js';
import { UserService, type ImageUploadFile } from './user.service.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';

@ApiTags('User')
@Controller(`${prefix}/user`)
export class UserController {
  constructor(private readonly userService: UserService) { }

  //& UPDATE PROFILE IMG
  @Patch('/profile-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Upload profile image (multipart file=image/*, max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing file / too large / not an image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: ImageUploadFile,
  ) {

    console.log('file', file)

    const data = await this.userService.uploadFile(user, file);
    return {
      data,
      message: 'Profile image uploaded successfully',
    };
  }

  //& USER SOFT DELETE
  @Patch('/delete/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Soft-delete user (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'User ID to soft-delete' })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {

    await this.userService.deleteUser(id)

    return {
      message: "User soft deleted successfully",
      data: null
    }
  }
}
