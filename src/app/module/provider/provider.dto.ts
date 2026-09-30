import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { ProviderType } from "../../../../generated/prisma/enums.js";


export class CreateProviderDto {
  @ApiProperty({ example: 'openai/gpt-oss-20b', description: 'Must match MODEL_ALLOWED preset' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'OpenAI GPT 20b' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ProviderType, example: ProviderType.GROQ })
  @IsEnum(ProviderType)
  type: ProviderType;

  @ApiProperty({ example: false })
  @IsBoolean() @IsOptional()
  isPremium: boolean;


  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

}

export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}