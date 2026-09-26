import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { CLOUDINARY, CloudinaryProvider } from '../../lib/cloudinary.js';

@Module({
  controllers: [UserController],
  providers: [UserService, CloudinaryProvider],
  exports: [CLOUDINARY]
})
export class UserModule { }
