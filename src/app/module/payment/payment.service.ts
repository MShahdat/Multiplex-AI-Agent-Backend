import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthenticatedUser, IQuery } from '../../interface/index.js';
import { PaymentWhereInput } from '../../../../generated/prisma/models.js';
import { PaymentMethod, PaymentStatus } from '../../../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';

@Injectable()
export class PaymentService {

  //& GET ALL PAYMENTS (ADMIN)
  async getAllPayments(query: IQuery) {

    const sort = query.sortBy ? query.sortBy : 'createdAt'
    const order = query.sortOrder ? query.sortOrder : 'desc'
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 9)

    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page must be a positive integer')
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be an integer between 1 and 100')
    }

    const andConditions: PaymentWhereInput[] = []
    const search = query.search?.trim()

    if (search) {
      andConditions.push({
        OR: [
          {
            id: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            subscription: {
              user: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            subscription: {
              user: {
                email: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
        ],
      })
    }

    if (query.status !== undefined) {
      if (!Object.values(PaymentStatus).includes(query.status as PaymentStatus)) {
        throw new BadRequestException('Invalid payment status')
      }
      andConditions.push({
        status: query.status as PaymentStatus
      })
    }

    if (query.method !== undefined) {
      if (!Object.values(PaymentMethod).includes(query.method as PaymentMethod)) {
        throw new BadRequestException('Invalid payment method')
      }
      andConditions.push({ method: query.method as PaymentMethod })
    }

    const payment = await prisma.payment.findMany({
      where: {
        AND: andConditions
      },
      include: {
        subscription: true
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sort]: order
      },
    })


    const total = await prisma.payment.count({
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
      payment,
      meta,
    };
  }


  //& GET MY PAYMENTS
  async getMyPayments(query: IQuery, user: AuthenticatedUser) {

    const sort = query.sortBy ? query.sortBy : 'createdAt'
    const order = query.sortOrder ? query.sortOrder : 'desc'
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 9)

    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page must be a positive integer')
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be an integer between 1 and 100')
    }

    const andConditions: PaymentWhereInput[] = [
      {
        subscription: {
          userId: user.id
        }
      },
      {
        status: PaymentStatus.PAID
      }
    ]
    const search = query.search?.trim()

    if (search) {
      andConditions.push({
        OR: [
          {
            id: {
              contains: search,
              mode: 'insensitive'
            }
          },
        ],
      })
    }

    if (query.method !== undefined) {
      if (!Object.values(PaymentMethod).includes(query.method as PaymentMethod)) {
        throw new BadRequestException('Invalid payment method')
      }
      andConditions.push({ method: query.method as PaymentMethod })
    }

    const payment = await prisma.payment.findMany({
      where: {
        AND: andConditions
      },
      include: {
        subscription: true
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sort]: order
      },
    })


    const total = await prisma.payment.count({
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
      payment,
      meta,
    };
  }
}
