import { IsEnum, IsNotEmpty, IsString } from "class-validator"
import { ProviderType } from "../../../../generated/prisma/enums.js";


export class CreateProviderDto {
  @IsEnum(ProviderType, {
    message: 'type must be either GROQ or ANTHROPIC',
  })
  @IsNotEmpty()
  type: ProviderType;
  @IsString() @IsNotEmpty()
  name: string
  @IsString() @IsNotEmpty()
  model: string
  @IsString() @IsNotEmpty()
  apiKey: string
}


