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
import { EmailVerifyDto, ForgotPasswordDto, LoginUserDto, RegisterUserDto, ResetPasswordDto } from './auth.dto.js';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import config from '../../config/index.js';


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

  //& REGISTER
  @Post('/register')
  async create(@Body() payload: RegisterUserDto) {

    const result = await this.authService.create(payload);
    return {
      data: result,
      message: 'OTP send successfully',
    }
  }


  //& EMAIL VERIFY
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


  //& LOGIN
  @Post('/login')
  async loginUser(
    @Body() payload: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {

    const result = await this.authService.loginUser(payload)

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      message: "User logged in successfully"
    }
  }

  //& GET ME
  @Get('/me')
  @UseGuards(AuthGuard)
  async getMe(
    @CurrentUser() user: AuthenticatedUser
  ) {
    const result = await this.authService.getMe(user)

    return {
      data: result,
      message: "Profile fetched successfully"
    }
  }


  //& TOKEN REFRESH
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


  //& FORGOT PASSWORD OTP
  @Post('/forgot-password')
  async forgotPass(
    @Body() payload: ForgotPasswordDto
  ) {

    const result = await this.authService.forgotPassword(payload)
    return {
      message: "OTP send successfully"
    }
  }


  //& RESET PASSWORD (NEW PASSWORD)
  @Post('/reset-password')
  async resetPassword(
    @Body() payload: ResetPasswordDto
  ) {

    await this.authService.resetPassword(payload)

    return {
      message: "Password updated successfully, Please login"
    }
  }


  //& GOOGLE LOGIN
  @Get('/google')
  async googleLogin() {

  }

  //& CALLBACK
  @Get('/google/callback')
  async googleCallback(
    @Req() req: Request & { user?: AuthenticatedUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const tokens = await this.authService.loginWithGoogle(req.user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      message: "User Logged in successfully"
    }
  }


  //& GITHUB LOGIN
  @Get('/github')
  async githubLogin() {
  }



  //& CALLBACK (GITHUB)
  @Get('/github/callback')
  async githubCallback(
    @Req() req: Request & { user?: AuthenticatedUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('GitHub authentication failed');
    }

    const tokens = await this.authService.loginWithGithub(req.user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'User logged in successfully',
    };
  }


}