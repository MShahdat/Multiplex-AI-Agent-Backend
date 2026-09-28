import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"


export class UpdateProviderDto {
  @IsBoolean() @IsOptional()
  isEnabled?: boolean
}


