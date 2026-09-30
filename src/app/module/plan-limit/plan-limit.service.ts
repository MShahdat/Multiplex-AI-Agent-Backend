import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../lib/prisma.js';
import { CreatePlanLimitDto, UPdatePlanLimitDto } from './plan-limit.dto.js';
import { IQuery } from '../../interface/index.js';
import { PlanProviderLimitWhereInput } from '../../../../generated/prisma/models.js';
import { PlanType } from '../../../../generated/prisma/enums.js';

@Injectable()
export class PlanLimitService {


  //& GET ALL
  async getAll(query: IQuery) {

    const sort = query.sortBy ? query.sortBy : 'createdAt'
    const order = query.sortOrder ? query.sortOrder : 'desc'
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 9)
    const andConditions: PlanProviderLimitWhereInput[] = []

    if (query.planTemplateId) {
      andConditions.push({
        planTemplateId: query.planTemplateId
      })
    }

    if (query.aiProviderId) {
      andConditions.push({
        aiProviderId: query.aiProviderId
      })
    }

    if (query.search) {
      andConditions.push({
        OR: [
          {
            aiProviderId: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            planTemplateId: {
              contains: query.search,
              mode: 'insensitive'
            }
          }
        ]
      })
    }

    const limits = await prisma.planProviderLimit.findMany({
      where: {
        AND: andConditions
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sort]: order
      },
      include: {
        aiProvider: true
      },
    })

    const total = await prisma.planProviderLimit.count({
      where: {
        AND: andConditions
      },
    });

    const meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return {
      limits,
      meta
    }
  }


  //& GET
  async getOne(id: string) {
    const row = await prisma.planProviderLimit.findUnique({
      where: { id },
      include: {
        planTemplate: {
          select: {
            id: true,
            code: true,
            type: true,
            billingCycle: true
          }
        },
        aiProvider: {
          select: {
            id: true,
            name: true,
            model: true
          }
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Limit row not found');
    }

    return row;
  }


  //& CREATE (ADMIN)
  async create(payload: CreatePlanLimitDto) {

    const isTem = await prisma.planTemplate.findUnique({
      where: {
        id: payload.planTemplateId
      }
    })

    if (!isTem) {
      throw new NotFoundException('plan template not found')
    }

    const provider = await prisma.aiProvider.findUnique({
      where: {
        id: payload.aiProviderId
      }
    })

    if (!provider) {
      throw new NotFoundException('Provider model not found!')
    }

    const dup = await prisma.planProviderLimit.findUnique({
      where: {
        planTemplateId_aiProviderId: {
          planTemplateId: payload.planTemplateId,
          aiProviderId: payload.aiProviderId
        }
      },
    });

    if (dup) {
      throw new ConflictException('Limit for this template+provider already exists.');
    }


    if (provider.isPremium && isTem.type === PlanType.FREE) {
      throw new BadRequestException('Premium provider limits not added free template ')
    }

    if (!provider.isPremium && isTem.type === PlanType.PREMIUM) {
      throw new BadRequestException('Free provider limits not added Premium template ')
    }

    const create = await prisma.planProviderLimit.create({
      data: {
        ...payload,
        maxTokensPerRequest: payload.maxTokensPerRequest ?? 2048
      },
    });

    return create
  }


  //& UPSERT
  async upsert(payload: CreatePlanLimitDto) {

    const { aiProviderId, planTemplateId, ...limit } = payload

    const isTem = await prisma.planTemplate.findUnique({
      where: {
        id: payload.planTemplateId
      }
    })
    if (!isTem) {
      throw new NotFoundException('plan template not found')
    }

    const provider = await prisma.aiProvider.findUnique({
      where: {
        id: payload.aiProviderId
      }
    })
    if (!provider) {
      throw new NotFoundException('Provider model not found!')
    }

    if (provider.isPremium && isTem.type === PlanType.FREE) {
      throw new BadRequestException('Premium provider limits not added free template ')
    }

    if (!provider.isPremium && isTem.type === PlanType.PREMIUM) {
      throw new BadRequestException('Free provider limits not added Premium template ')
    }
    const updateCreate = await prisma.planProviderLimit.update({
      where: {
        planTemplateId_aiProviderId: {
          planTemplateId: payload.planTemplateId,
          aiProviderId: payload.aiProviderId
        }
      },
      data: {
        ...payload
      },
    });

    return updateCreate
  }

}