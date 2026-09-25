import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcrypt';
import config from '../../config/index.js';
import crypto from 'crypto';
import { redisClient } from '../../lib/redis.js';
import path from 'path';
import ejs from 'ejs';
import { transporter } from '../../lib/nodemailer.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { EmailVerifyDto, ForgotPasswordDto, LoginUserDto, RegisterUserDto, ResetPasswordDto } from './auth.dto.js';
import { jwtUtils } from '../../utils/jwt.js';
import { UserStatus } from '../../../../generated/prisma/enums.js';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { AuthenticatedUser } from '../../interface/index.js';

@Injectable()
export class AuthService {


  //& REGISTER USER
  async create(payload: RegisterUserDto) {
    const { name, password } = payload;

    const email = payload.email.trim().toLowerCase();

    const isUserExists = await prisma.user.findUnique({
      where: { email },
    });

    if (isUserExists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const expirationTime = 5 * 60;
    const otp = crypto.randomInt(100000, 1000000);
    const otpKey = `user-register-otp: ${email}`;

    await redisClient.set(otpKey, otp, {
      expiration: {
        type: 'EX',
        value: expirationTime,
      },
    });

    const registerKey = `user-register-data: ${email}`;
    const registerValue = {
      name,
      email,
      password: hashedPassword,
    };

    await redisClient.set(registerKey, JSON.stringify(registerValue), {
      expiration: {
        type: 'EX',
        value: expirationTime,
      },
    });

    const templatePath = path.join(
      process.cwd(),
      'src/app/template/verification.otp.ejs',
    );

    const templateData = {
      name,
      otp,
      expire: expirationTime / 60,
      appName: config.app_name,
    };

    const html = await ejs.renderFile(templatePath, templateData);

    await transporter.sendMail({
      from: config.smtp_sender,
      to: email,
      subject: 'Email Verification',
      html,
    });

  }

  //& EMAIL VERIFY AND ACCOUNT CREATE
  async verifyEmail(payload: EmailVerifyDto) {
    const email = payload.email.trim().toLowerCase();
    const { otp } = payload;

    const registerKey = `user-register-data: ${email}`;
    const redisData = await redisClient.get(registerKey);

    const otpKey = `user-register-otp: ${email}`;
    const redisOTP = await redisClient.get(otpKey);

    if (!redisData || !redisOTP) {
      throw new NotFoundException('Redis data and OTP not exist');
    }

    const payloadData = JSON.parse(redisData);

    if (payloadData.email !== email) {
      throw new BadRequestException('Invalid Email');
    }

    if (redisOTP !== String(otp)) {
      throw new BadRequestException('OTP does not match');
    }

    const isUser = await prisma.user.findUnique({
      where: { email },
    });

    if (isUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await prisma.user.create({
      data: {
        name: payloadData.name,
        email: payloadData.email,
        password: payloadData.password,
        role: Role.USER,
        emailVerified: true,
        status: 'ACTIVE',
      },
      omit: {
        password: true,
      },
    });

    await redisClient.del([otpKey, registerKey]);

    const jwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );


    return {
      accessToken,
      refreshToken,
      user
    };
  }


  //& LOGIN USER
  async loginUser(payload: LoginUserDto) {
    const { password } = payload;
    const email = payload.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found!')
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new BadRequestException("User is blocked");
    }

    if (user.password === null) {
      throw new BadRequestException(
        "User already has an account with google. please try to login with google",
      );
    }

    if (user.isDeleted || user.status === "DELETED") {
      throw new BadRequestException('User alredy deleted!')
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password as string,
    );

    if (!isPasswordMatched) {
      throw new BadRequestException('Invalid Creadential')

    }

    const jwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  };


  //& GET ME
  async getMe(user: AuthenticatedUser) {

    const isUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      omit: {
        password: true,
      },
    });

    if (!isUser) {
      throw new NotFoundException('User Not Found!')
    }

    return isUser
  };

  //& CREATE ACCESS TOKEN
  async refreshToken(token: string) {

    const verifiedRefreshToken = jwtUtils.verifyToken(
      token,
      config.jwt_refresh_secret,
    );

    if (
      !verifiedRefreshToken.success ||
      !verifiedRefreshToken.data ||
      typeof verifiedRefreshToken.data === 'string'
    ) {
      throw new UnauthorizedException(
        config.node_env === "development"
          ? verifiedRefreshToken.error
          : "Invalid refresh token",
      );
    }

    const data = verifiedRefreshToken.data as JwtPayload;
    if (typeof data.id !== 'string') {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const user = await prisma.user.findUnique({
      where: { id: data.id },
    });

    if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        "User is inactive or not found",
      );
    }

    const jwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

    return {
      accessToken,
      refreshToken,
    };
  };



  //& FORGOT PASSWORD
  async forgotPassword(payload: ForgotPasswordDto) {
    const { email } = payload;

    const isExistUser = await prisma.user.findUnique({
      where: {
        email
      },
    });

    if (!isExistUser) {
      throw new NotFoundException("User does not exist");
    }

    if (isExistUser.status === "BLOCKED") {
      throw new ForbiddenException("User thas temporary blocked");
    }

    if (isExistUser.status === UserStatus.DELETED) {
      throw new ForbiddenException("user has deleted");
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const expirationTime = 5 * 60;
    const key = `forgot-password-otp: ${isExistUser.email}`;
    await redisClient.set(key, otp, {
      expiration: {
        type: "EX",
        value: expirationTime,
      },
    });

    const templatePath = path.join(
      process.cwd(),
      "src/app/template/forgot.password.opt.ejs",
    );

    const templateData = {
      name: isExistUser.name,
      otp,
      expire: expirationTime / 60,
      appName: config.app_name
    };

    const html = await ejs.renderFile(templatePath, templateData);

    await transporter.sendMail({
      from: config.smtp_sender,
      to: isExistUser.email,
      subject: "Forgot Password",
      html,
    });
  };



  //& RESET PASSWORD
  async resetPassword(payload: ResetPasswordDto) {
    const { email, otp, newPassword } = payload;

    const isExistUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!isExistUser) {
      throw new NotFoundException("User does not exist");
    }

    if (isExistUser.status === "BLOCKED") {
      throw new ForbiddenException("User thas temporary blocked");
    }

    if (isExistUser.status === UserStatus.DELETED) {
      throw new BadRequestException("user has deleted");
    }

    const key = `forgot-password-otp: ${isExistUser.email}`;
    const redisOTP = await redisClient.get(key);

    if (!redisOTP) {
      throw new BadRequestException("Invalid OTP");
    }

    if (redisOTP !== otp) {
      throw new BadRequestException("OTP does not match");
    }

    const hashPass = await bcrypt.hash(
      newPassword,
      Number(config.bcrypt_salt_rounds),
    );

    await prisma.user.update({
      where: { email },
      data: {
        password: hashPass,
      },
    });

    const templateData = {
      name: isExistUser.name,
      appName: config.app_name
    };

    const html = await ejs.renderFile(
      path.join(process.cwd(), "src/app/template/reset.password.ejs"),
      templateData,
    );

    await transporter.sendMail({
      from: config.smtp_sender,
      to: isExistUser.email,
      subject: "Reset Password",
      html,
    });

    await redisClient.del(key);

    const jwtPayload = {
      id: isExistUser.id,
      name: isExistUser.name,
      email: isExistUser.email,
      role: isExistUser.role,
    };

    const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

    return {
      accessToken,
      refreshToken
    }
  };

}
