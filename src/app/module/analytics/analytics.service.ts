import { Injectable } from '@nestjs/common';
import { prisma } from '../../lib/prisma.js';
import { PaymentStatus, SubscriptionStatus } from '../../../../generated/prisma/enums.js';

@Injectable()
export class AnalyticsService {



  //& ADMIN ANALYTICS
  async analytics() {

    const totalUsers = await prisma.user.count({
      where: {
        isDeleted: false
      }
    });

    const totalAiProviders = await prisma.aiProvider.count()

    const totalActiveProviders = await prisma.aiProvider.count({
      where: {
        isEnabled: true,
      }
    })

    const totalPremiumProviders = await prisma.aiProvider.count({
      where: {
        isPremium: true,
      }
    })

    const totalSubscription = await prisma.subscription.count({
      where: {
        status: {
          in: ['ACTIVE', 'CANCELED', 'EXPIRED']
        }
      }
    })

    const totalActiveSubscriver = await prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE
      }
    })


    const totalPayment = await prisma.payment.count({
      where: {
        status: PaymentStatus.PAID
      }
    })

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID
      },
      _sum: {
        amount: true
      }
    })


    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const currentMonthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalUsers,
      totalAiProviders,
      totalActiveProviders,
      totalPremiumProviders,
      totalSubscription,
      totalActiveSubscriver,
      totalPayment,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      currentMonthlyRevenue: currentMonthlyRevenue._sum.amount ?? 0,
    }



  }
}
