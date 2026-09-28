import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MsgPromptDto } from './message.dto.js';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedUser } from '../../interface/index.js';

@Injectable()
export class MessageService {


  async createMsg(payload: MsgPromptDto, user: AuthenticatedUser) {

    const isModel = await prisma.aiProvider.findUnique({
      where: {
        id: payload.providerId
      }
    })

    if (!isModel) {
      throw new NotFoundException('Model not found!')
    }

    if (!isModel.isEnabled) {
      throw new BadRequestException('Model is disabled')
    }


  }
}
