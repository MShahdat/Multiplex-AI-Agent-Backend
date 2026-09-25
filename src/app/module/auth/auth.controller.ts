import { Body, Controller, Post } from '@nestjs/common';
import { prefix } from '../../utils/global.prefix.js';
import { AuthService } from './auth.service.js';
import { EmailVerifyDto, RegisterUserDto } from './auth.dto.js';

@Controller(`${prefix}/auth`)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  create(@Body() payload: RegisterUserDto) {
    return this.authService.create(payload);
  }

  @Post('/email-verify')
  verifyEmail(@Body() payload: EmailVerifyDto) {
    return this.authService.verifyEmail(payload);
  }
}
