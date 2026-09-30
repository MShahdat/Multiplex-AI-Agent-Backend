import { Module } from '@nestjs/common';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';
import { OptionalAuthGuard } from '../../common/guard/optional-auth.guard.js';

@Module({
  controllers: [MessageController],
  providers: [MessageService, OptionalAuthGuard]
})
export class MessageModule {}
