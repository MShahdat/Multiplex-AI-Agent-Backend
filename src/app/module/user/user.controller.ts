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
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { prefix } from '../../utils/global.prefix.js';
import { UserService, type ImageUploadFile } from './user.service.js';
import type { AuthenticatedUser } from '../../interface/index.js';

@Controller(`${prefix}/user`)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Patch('/profile-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
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

  @Patch('/delete/:id')
  @UseGuards(AuthGuard)
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
