import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class MsgPromptDto {
  @IsString() @IsOptional()
  conversationId?: string
  @IsString() @IsNotEmpty()
  providerId: string;
  @IsString() @IsNotEmpty() @MaxLength(2000)
  prompt: string;
}

export type ChatRoleMsg = {
  role: 'system' | 'user' | 'assistant';
  content: string
};