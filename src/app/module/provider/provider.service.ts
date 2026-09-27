import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateProviderDto } from './provider.dto.js';
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
}


