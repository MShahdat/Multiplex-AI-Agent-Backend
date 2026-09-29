import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'John Doe', minLength: 3, description: 'Name, min 3 chars' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'john@example.com', format: 'email' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Pass@1234',
    minLength: 8,
    description: 'min 8 + upper + lower + number + special',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a number' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Password must contain a special character' })
  password: string;
}


export class EmailVerifyDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ example: '123456', description: '6-digit OTP from email' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}


export class LoginUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ example: 'Pass@1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}


export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string
}




export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
  @ApiProperty({ example: 'NewPass@1234' })
  @IsString()
  @IsNotEmpty()
  newPassword: string
}
