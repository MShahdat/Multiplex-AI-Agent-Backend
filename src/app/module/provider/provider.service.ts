import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProviderDto, UpdateProviderDto } from './provider.dto.js';
import { prisma } from '../../lib/prisma.js';
import { AiProviderWhereInput } from '../../../../generated/prisma/models.js';
import { MODEL_ALLOWED } from '../../lib/groq.js';
import { encryptApiKey } from '../../lib/crypto.js';
import config from '../../config/index.js';


@Injectable()
export class ProviderService {

  //& CREATE
  async create(payload: CreateProviderDto) {

    const preset = MODEL_ALLOWED.find((m) => m.model === payload.model.trim())

    if (!preset) {
      throw new BadRequestException(`model must be one of preset: ${MODEL_ALLOWED.map((m) => m.model).join(', ')}`);
    }

    if (payload.isDefault) {
      await prisma.aiProvider.updateMany({
        data: {
          isDefault: false
        }
      })
    }

    const isModel = await prisma.aiProvider.findUnique({
      where: {
        model: payload.model
      }
    })

    if (isModel) {
      throw new ConflictException('model alraedy exists!')
    }

    const { iv, authTag, encryptKey } = encryptApiKey(config.groq_api_key)

    const createProvider = await prisma.aiProvider.create({
      data: {
        name: payload.name,
        model: payload.model,
        type: payload.type,
        authTag,
        encryptedApiKey: encryptKey,
        iv,
        isPremium: payload.isPremium ?? false,
        isDefault: payload.isDefault ?? false
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
  async getModels(query: Record<string, any>) {

    console.log('query', query)

    const andConditions: AiProviderWhereInput[] = [
      {
        isEnabled: true
      }
    ]
    const search = typeof query.search === 'string' ? query.search.trim() : ''

    if (search) {
      andConditions.push({
        OR: [
          {
            model: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            name: {
              contains: search,
              mode: "insensitive"
            }
          },
        ],
      })
    }

    if (query.isPremium !== undefined) {
      const isPremiumBool = query.isPremium === 'true' || query.ispremium === true

      andConditions.push({
        isPremium: isPremiumBool
      })
    }

    const res = await prisma.aiProvider.findMany({
      where: {
        AND: andConditions
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

    if (payload.isEnabled && isModel.isEnabled) {
      throw new ConflictException('Confilict previous isEnable')
    }

    if (payload.isPremium && isModel.isPremium) {
      throw new ConflictException('Conflice with previous isPremium')
    }

    if (payload.isDefault) {
      await prisma.aiProvider.updateMany({
        data: {
          isDefault: false
        }
      })
    }
    const update = await prisma.aiProvider.update({
      where: {
        id
      },
      data: {
        ...payload
      },
      omit: {
        encryptedApiKey: true,
        iv: true,
        authTag: true
      }
    })
    return update
  }


}




