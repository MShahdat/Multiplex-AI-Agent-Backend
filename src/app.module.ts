import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AuthModule } from './app/module/auth/auth.module.js';
import { UserModule } from './app/module/user/user.module.js';

@Module({
  controllers: [AppController],
  imports: [AuthModule, UserModule],
})
export class AppModule {}
