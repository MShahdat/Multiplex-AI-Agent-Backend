import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      success: true,
      statusCode: 200,
      author: 'Md. Shahdat Hossain',
      message: 'Build a robust and sclable Multi-agent AI Chatbot',
    };
  }
}
