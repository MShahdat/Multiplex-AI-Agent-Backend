import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class MsgPromptDto {
  @ApiPropertyOptional({
    example: 'clx_conversation_id',
    description: 'Omit to start a new conversation',
  })
  @IsString() @IsOptional()
  conversationId?: string
  @ApiProperty({ example: 'clx_provider_id', description: 'Provider/model ID' })
  @IsString() @IsNotEmpty()
  providerId: string;
  @ApiProperty({ example: 'Explain quantum computing simply', maxLength: 2000 })
  @IsString() @IsNotEmpty() @MaxLength(2000)
  prompt: string;
}

export type ChatRoleMsg = {
  role: 'system' | 'user' | 'assistant';
  content: string
};



export class UpdateTitleDto {
  @ApiPropertyOptional({ example: 'My new chat title' })
  @IsString() @IsOptional()
  title?: string
}
