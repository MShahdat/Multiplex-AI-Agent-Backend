import { BadGatewayException, BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MsgPromptDto, UpdateTitleDto } from './message.dto.js';
import { prisma } from '../../lib/prisma.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import { groqFallback } from '../../lib/groq.js';
import { MessageStatus, PlanType } from '../../../../generated/prisma/enums.js';

@Injectable()
export class MessageService {

  //& CREATE CHAT
  async createMsg(payload: MsgPromptDto, user: AuthenticatedUser) {
    const isModel = await prisma.aiProvider.findUnique({
      where: {
        id: payload.providerId,
      }
    });

    if (!isModel) {
      throw new NotFoundException('Model not found!');
    }

    if (!isModel.isEnabled) {
      throw new BadRequestException('Model is disabled');
    }

    try {
      const msg = await groqFallback.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: payload.prompt,
          },
        ],
        model: isModel.model || isModel.name,
      });

      let title = '';
      if (!payload.conversationId) {
        const cleanPrompt = payload.prompt.replace(/[\n\r]+/g, ' ').trim();
        title = cleanPrompt.length > 45 ? `${cleanPrompt.substring(0, 45)}...` : cleanPrompt;
      }

      const transactionRes = await prisma.$transaction(
        async (tx) => {
          const conId = async () => {
            if (!payload.conversationId) {
              const conversion = await tx.conversation.create({
                data: {
                  title,
                  userId: user.id,
                  providerId: isModel.id
                }
              })
              return conversion.id
            } else {
              return payload.conversationId
            }
          }

          const id = await conId()


          const message = await tx.message.create({
            data: {
              prompt: payload.prompt,
              providerId: isModel.id,
              content: msg.choices[0].message.content || msg.choices[0].message.reasoning,
              conversationId: id,
              status: MessageStatus.COMPLETED,
              promptTokens: msg.usage?.prompt_tokens,
              completionTokens: msg.usage?.completion_tokens,
              totalTokens: msg.usage?.total_tokens,
            },
            omit: {
              providerId: true,
              createdAt: true,
              updatedAt: true,
            }
          })

          return {
            model: isModel.model,
            message,
          }
        },
        {
          maxWait: 10000,
          timeout: 15000
        }
      )

      return transactionRes;
      // return msg
    }
    catch (error: any) {
      throw new BadGatewayException('Failed to generate a response from the AI provider.');
    }
  }


  //& GET MY CONVERSION
  async getMyConversation(user: AuthenticatedUser) {

    const conversation = await prisma.conversation.findMany({
      where: {
        userId: user.id
      },
      include: {
        messages: true
      }
    })

    return conversation
  }


  //& SINGLE CONVERSATION 
  async getSingleConversation(id: string, user: AuthenticatedUser) {

    const isConversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: user.id
      },
      include: {
        messages: true
      }
    })

    if (!isConversation) {
      throw new NotFoundException('Conversation not found')
    }

    return isConversation
  }




  //& UPDATE TITLE 
  async updateTitle(payload: UpdateTitleDto, id: string, user: AuthenticatedUser) {

    const isConversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: user.id
      }
    })

    if (!isConversation) {
      throw new NotFoundException('Conversation not found')
    }

    if (isConversation.isArchived) {
      throw new BadRequestException('Conversation is archived')
    }

    const update = await prisma.conversation.update({
      where: {
        id
      },
      data: {
        title: payload.title
      },
      select: {
        title: true
      }
    })
    return update
  }

  //& ARCHIVE CONVERSATION 
  async archive(id: string, user: AuthenticatedUser) {

    const isConversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: user.id
      }
    })

    if (!isConversation) {
      throw new NotFoundException('Conversation not found')
    }

    if (isConversation.isArchived) {
      throw new ConflictException('Conversation already archived')
    }

    await prisma.conversation.update({
      where: {
        id
      },
      data: {
        isArchived: true,
        isPinned: false
      },
    })
  }


  //& REMOVE ARCHIVE CONVERSATION 
  async removeArchive(id: string, user: AuthenticatedUser) {

    const isConversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: user.id
      }
    })

    if (!isConversation) {
      throw new NotFoundException('Conversation not found')
    }

    if (!isConversation.isArchived) {
      throw new BadRequestException('Conversation not archieved')
    }

    await prisma.conversation.update({
      where: {
        id
      },
      data: {
        isArchived: false
      },
    })
  }

}
