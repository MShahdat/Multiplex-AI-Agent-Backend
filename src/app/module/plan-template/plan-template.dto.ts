import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateIf } from "class-validator";
import { PlanType, SubscriptionType } from "../../../../generated/prisma/enums.js";

export class CreatePlanTemplateDto {
  @ApiProperty({ example: 'PREMIUM_MONTHLY' })
  @IsIn(['FREE', 'PREMIUM_MONTHLY', 'PREMIUM_HALF_YEARLY', 'PREMIUM_YEARLY'])
  code: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_HALF_YEARLY' | 'PREMIUM_YEARLY';

  @ApiProperty({ enum: PlanType, example: PlanType.PREMIUM })
  @IsEnum(PlanType)
  type: PlanType;

  @ApiProperty({ example: 500, description: ' FREE must be 0.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: SubscriptionType, example: SubscriptionType.MONTHLY, description: 'Required for PREMIUM, must be null for FREE' })
  @ValidateIf((o) => o.type === PlanType.PREMIUM)
  @IsEnum(SubscriptionType)
  billingCycle?: SubscriptionType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}




export class UpdatePlanTemplateDto {
  @ApiPropertyOptional({ example: 550 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'PREMIUM_MONTHLY' })
  @IsOptional()
  @IsIn(['FREE', 'PREMIUM_MONTHLY', 'PREMIUM_HALF_YEARLY', 'PREMIUM_YEARLY'])
  code: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_HALF_YEARLY' | 'PREMIUM_YEARLY';

}