import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { prefix } from '../../utils/global.prefix.js';
import { AuthService } from './auth.service.js';
import { EmailVerifyDto, LoginUserDto, RegisterUserDto } from './auth.dto.js';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';


@Controller(`${prefix}/auth`)
export class AuthController {
  constructor(private authService: AuthService) { }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 30 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('/register')
  create(@Body() payload: RegisterUserDto) {

    const result = this.authService.create(payload);
    return {
      data: result,
      message: 'OTP send successfully',
    }
  }

  @Post('/email-verify')
  async verifyEmail(
    @Body() payload: EmailVerifyDto,
    @Res({ passthrough: true }) res: Response
  ) {

    const result = await this.authService.verifyEmail(payload)

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        data: result.user
      },
      message: 'User Created Succesfully'
    }
  }


  @Post('/login')
  async loginUser(
    @Body() payload: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {

    const result = await this.authService.loginUser(payload)

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      data: result.user,
      message: "User logged in successfully"
    }
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.authService.getMe(user)

    return {
      data: result,
      message: "Profile fetched successfully"
    }
  }

  @Get('/admin')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminOnly(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: user,
      message: "admin only route"
    }
  }


  @Post('/refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const result = await this.authService.refreshToken(refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      message: 'Tokens refreshed successfully',
    };
  }


}
