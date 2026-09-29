import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsBoolean, IsOptional } from "class-validator"


export class UpdateProviderDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean() @IsOptional()
  isEnabled?: boolean
}

