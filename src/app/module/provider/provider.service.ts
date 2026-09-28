import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProviderDto } from './provider.dto.js';
import { prisma } from '../../lib/prisma.js';


@Injectable()
export class ProviderService {


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
        isEnabled: true
      },
      omit: {
        authTag: true,
        encryptedApiKey: true,
        iv: true
      }
    })
    return res
  }



  //& ENABLED (ADMIN)
  async updateModel(id: string) {

    const isModel = await prisma.aiProvider.findUnique({
      where: {
        id
      }
    })

    if (!isModel) {
      throw new NotFoundException('Model not found')
    }

    if (isModel.isEnabled) {
      throw new BadRequestException('already enabled')
    }

    await prisma.aiProvider.update({
      where: {
        id
      },
      data: {
        isEnabled: true
      }
    })

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

    if (!isModel.isEnabled) {
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




