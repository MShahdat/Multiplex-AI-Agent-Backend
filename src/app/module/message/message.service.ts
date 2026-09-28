import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MsgPromptDto } from './message.dto.js';
import { prisma } from '../../lib/prisma.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import { groqFallback } from '../../lib/groq.js';
import { MessageStatus } from '../../../../generated/prisma/enums.js';

@Injectable()
export class MessageService {

  //& CREATE CHAT
  async createMsg(payload: MsgPromptDto, user: AuthenticatedUser) {
    const isModel = await prisma.aiProvider.findUnique({
      where: {
        id: payload.providerId,
      },
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

      const titleRes = await groqFallback.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `${msg.choices[0].message.content} You are a system utility. Summarize the user prompt and response context into a short, concise chat title (maximum 1 sentence)`,
          },
        ],
        model: isModel.model
      })

      const title = titleRes.choices[0].message.content ?? ''

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
}
