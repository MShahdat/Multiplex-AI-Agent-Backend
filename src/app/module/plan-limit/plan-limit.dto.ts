import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from "class-validator";



export class CreatePlanLimitDto {
  @ApiProperty({ example: 'cuid-plan-template-id', description: 'FK -> PlanTemplate.id (admin creates template first)' })
  @IsUUID() @IsNotEmpty()
  planTemplateId: string;

  @ApiProperty({ example: 'cuid-provider-id', description: 'FK -> AiProvider.id (admin creates provider first)' })
  @IsUUID() @IsNotEmpty()
  aiProviderId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestPerMinute: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestPerDay: number;

  @ApiProperty({ example: 4000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  tokenPerMinute: number;

  @ApiProperty({ example: 100000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  tokenPerDay: number;

  @ApiPropertyOptional({ example: 2048 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokensPerRequest?: number;
}




export class UPdatePlanLimitDto {
  @ApiProperty({ example: 'cuid-plan-template-id', description: 'FK -> PlanTemplate.id (admin creates template first)' })
  @IsUUID() @IsNotEmpty()
  planTemplateId: string;

  @ApiProperty({ example: 'cuid-provider-id', description: 'FK -> AiProvider.id (admin creates provider first)' })
  @IsUUID() @IsNotEmpty()
  aiProviderId: string;


  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestPerMinute?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestPerDay?: number;

  @ApiPropertyOptional({ example: 8000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  tokenPerMinute?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  tokenPerDay?: number;

  @ApiPropertyOptional({ example: 4096 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokensPerRequest?: number;
}