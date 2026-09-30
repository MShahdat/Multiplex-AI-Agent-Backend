import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanTemplateDto, UpdatePlanTemplateDto } from './plan-template.dto.js';
import { PlanType } from '../../../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';

@Injectable()
export class PlanTemplateService {

  //& CREATE
  async create(payload: CreatePlanTemplateDto) {

    if (payload.type === PlanType.FREE) {
      if (payload.code !== 'FREE') {
        throw new BadRequestException('Code must be FREE for free plan')
      }
      if (payload.billingCycle || payload.price !== 0) {
        throw new BadRequestException('Price must be 0 for FREE plan and billing cycle will be null')
      }
    }

    if (payload.type === PlanType.PREMIUM) {
      if (!payload.billingCycle) {
        throw new BadRequestException('Billing cycle must need to premium plan')
      }
      if (payload.code === 'FREE') {
        throw new BadRequestException('Code FREE and type conflict')
      }
    }

    const isTemplate = await prisma.planTemplate.findUnique({
      where: {
        code: payload.code
      }
    });

    if (isTemplate) {
      throw new ConflictException('Code already in exists');
    }


    const create = await prisma.planTemplate.create({
      data: {
        code: payload.code,
        type: payload.type,
        price: payload.price ?? 0,
        billingCycle: payload.type === PlanType.PREMIUM ? payload.billingCycle : null,
        isActive: payload.isActive ?? true
      },
    });

    return create
  }

  //& GET ALL
  async getAll() {
    const all = await prisma.planTemplate.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        {
          type: 'asc'
        },
        {
          billingCycle: 'asc'
        }
      ]
    })
    return all
  }




  //& GET SINGLE
  async getOne(id: string) {
    const template = await prisma.planTemplate.findUnique({
      where: {
        id,
        isActive: true
      }
    });

    if (!template) {
      throw new NotFoundException('Plan template not found');
    }
    return template;
  }



  //& UPDATE (ADMIN)
  async update(payload: UpdatePlanTemplateDto, id: string) {

    const existing = await prisma.planTemplate.findUnique({
      where: {
        id
      }
    });

    if (!existing) {
      throw new NotFoundException('Plan template not found');
    }

    if (existing.type === PlanType.FREE) {
      if (payload.code !== 'FREE') {
        throw new BadRequestException('Code must be FREE for free plan')
      }
      if (existing.billingCycle || payload.price !== 0) {
        throw new BadRequestException('Price must be 0 for FREE plan and billing cycle will be null')
      }
    }

    if (existing.type === PlanType.PREMIUM) {
      if (!existing.billingCycle) {
        throw new BadRequestException('Billing cycle must need to premium plan')
      }
      if (payload.code === 'FREE') {
        throw new BadRequestException('Code FREE and type conflict')
      }
    }

    if (payload.code && payload.code !== existing.code) {
      const isExist = await prisma.planTemplate.findUnique({
        where: {
          code: payload.code
        }
      });
      if (isExist) {
        throw new ConflictException('Code already in use');
      }
    }

    const update = await prisma.planTemplate.update({
      where: { id },
      data: {
        ...payload
      }
    });

    return update
  }
}
