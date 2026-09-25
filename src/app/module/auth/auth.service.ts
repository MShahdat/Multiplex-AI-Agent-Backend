import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
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
import { EmailVerifyDto, RegisterUserDto } from './auth.dto.js';

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

    return {
      message: 'OTP send successfully',
    };
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

    return user;
  }
}
