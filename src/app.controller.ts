import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health / root (note: ResponseInterceptor drops extra fields, actual envelope is { success, message, data })' })
  @ApiResponse({ status: 200, description: 'Build a robust and sclable Multi-agent AI Chatbot' })
  getHello() {
    return {
      success: true,
      statusCode: 200,
      author: 'Md. Shahdat Hossain',
      message: 'Build a robust and sclable Multi-agent AI Chatbot',
    };
  }
}
