import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProviderDto, UpdateProviderDto } from './provider.dto.js';
import { prisma } from '../../lib/prisma.js';
import { encryptApiKey } from '../../lib/crypto.js';
import { GROQ_ALLOWED } from '../../lib/groq.js';

@Injectable()
export class ProviderService {


  private getMaxTokensForModel(model: string): number {
    switch (model) {
      case 'llama-3.3-70b-versatile':
        return 32768;
      case 'llama-3.1-8b-instant':
        return 131072;
      case 'openai/gpt-oss-120b':
        return 65536;
      default:
        return 4096;
    }
  }


  //& CREATE
  async create(payload: CreateProviderDto) {

    const isModel = await prisma.aiProvider.findUnique({
      where: {
        model: payload.model
      }
    })

    if (isModel) {
      throw new ConflictException('model alraedy exists!')
    }


    if (!GROQ_ALLOWED.includes(payload.model)) {
      throw new BadRequestException('Please add correct model name')
    }

    const maxToken = this.getMaxTokensForModel(payload.model)
    const { iv, authTag, encryptKey } = encryptApiKey(payload.apiKey)

    const createProvider = await prisma.aiProvider.create({
      data: {
        name: payload.name,
        model: payload.model,
        type: payload.type,
        authTag,
        encryptedApiKey: encryptKey,
        iv,
        maxTokensPerRequest: maxToken
      },
      omit: {
        encryptedApiKey: true,
        authTag: true,
        iv: true
      }
    })

    return createProvider
  }


  //& GET ALL BY ADMIN
  async getAllModel() {
    const res = await prisma.aiProvider.findMany({
      omit: {
        authTag: true,
        encryptedApiKey: true,
        iv: true
      }
    })
    return res
  }


  //& GET ALL (PUBLIC)
  async getModels() {
    const res = await prisma.aiProvider.findMany({
      where: {
        isEnabled: true,
        isHealthy: true,
      },
      omit: {
        authTag: true,
        encryptedApiKey: true,
        iv: true
      }
    })
    return res
  }



  //& UPDATE (ADMIN)
  async updateModel(payload: UpdateProviderDto, id: string) {

    const isModel = await prisma.aiProvider.findUnique({
      where: {
        id
      }
    })

    if (!isModel) {
      throw new NotFoundException('Model not found')
    }


    const transactionRes = await prisma.$transaction(
      async (tx) => {
        if (payload.isDefault) {
          await tx.aiProvider.updateMany({
            data: {
              isDefault: false
            }
          })
        }

        const update = await tx.aiProvider.update({
          where: {
            id
          },
          data: {
            ...payload
          }
        })

        return update

      },
      {
        maxWait: 10000,
        timeout: 15000
      }
    )
    return transactionRes
  }


  //& DISABLE MODEL (ADMIN)
  async disableModel(id: string) {

    const isModel = await prisma.aiProvider.findUnique({
      where: {
        id
      }
    })

    if (!isModel) {
      throw new NotFoundException('Model not found')
    }

    if (isModel.isDefault) {
      throw new BadRequestException('You can not disable model. Please remove default first!')
    }

    if (isModel.isEnabled) {
      throw new ConflictException('already disabled')
    }

    await prisma.aiProvider.update({
      where: {
        id: isModel.id
      },
      data: {
        isEnabled: false
      }
    })

  }
}


