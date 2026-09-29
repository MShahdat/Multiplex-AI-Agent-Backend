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
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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


@ApiTags('Auth')
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
  @ApiOperation({ summary: 'Register, send OTP mail' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'OTP send successfully. Wrapped as { success, message, data }.' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() payload: RegisterUserDto) {

    const result = await this.authService.create(payload);
    return {
      data: result,
      message: 'OTP send successfully',
    }
  }


  //& EMAIL VERIFY
  @Post('/email-verify')
  @ApiOperation({ summary: 'Verify OTP, create user + FREE plan, set cookies' })
  @ApiBody({ type: EmailVerifyDto })
  @ApiResponse({ status: 201, description: 'User Created Successfully. Sets accessToken + refreshToken cookies.' })
  @ApiResponse({ status: 400, description: 'Invalid/expired OTP' })
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
  @ApiOperation({ summary: 'Credential login, set cookies' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 201, description: 'User logged in successfully. Sets cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or BLOCKED/DELETED user' })
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
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current profile (cookie accessToken or Bearer)' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized: token missing/invalid or user inactive' })
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
  @ApiOperation({ summary: 'Rotate access + refresh pair via refreshToken cookie' })
  @ApiResponse({ status: 201, description: 'Tokens refreshed successfully. Sets cookies.' })
  @ApiResponse({ status: 401, description: 'Refresh token missing/invalid' })
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
  @ApiOperation({ summary: 'Send forgot-password OTP mail' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 201, description: 'OTP send successfully' })
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
  @ApiOperation({ summary: 'Verify OTP, update hashed password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 201, description: 'Password updated successfully' })
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
  @ApiOperation({ summary: 'Initiate Google OAuth (passport redirect, 302 — Try-it-out will not complete flow)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  async googleLogin() {

  }

  //& CALLBACK
  @Get('/google/callback')
  @ApiOperation({ summary: 'Google OAuth callback — sets cookies + returns tokens' })
  @ApiResponse({ status: 200, description: 'User Logged in successfully' })
  @ApiResponse({ status: 401, description: 'Google authentication failed' })
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
  @ApiOperation({ summary: 'Initiate GitHub OAuth (passport redirect, 302)' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub consent screen' })
  async githubLogin() {
  }



  //& CALLBACK (GITHUB)
  @Get('/github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback — sets cookies + returns tokens' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'GitHub authentication failed' })
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
