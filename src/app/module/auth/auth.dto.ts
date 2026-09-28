import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Matches, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3)
  name: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

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
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  otp: string;
}


export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}


export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string
}




export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  otp: string;
  @IsString()
  @IsNotEmpty()
  newPassword: string
}