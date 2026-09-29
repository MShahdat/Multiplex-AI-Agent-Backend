import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getBkashIdToken } from '../../lib/bkash.js';
import { AuthenticatedUser, IQuery } from '../../interface/index.js';
import { SubscriptionDto } from './subscription.dto.js';
import { prisma } from '../../lib/prisma.js';
import { PaymentMethod, PaymentStatus, PlanType, SubscriptionStatus, SubscriptionType } from '../../../../generated/prisma/enums.js';
import config from '../../config/index.js';
import { randomUUID } from 'node:crypto';
import { addMonths, addYears } from 'date-fns';
import { transporter } from '../../lib/nodemailer.js';
import { generateInvoicePdf } from '../../utils/invoice.js';
import { SubscriptionWhereInput } from '../../../../generated/prisma/models.js';
import { stripe } from '../../lib/stripe.js';
import { paymentSuccess } from './stripe.tuility.js';
import Stripe from 'stripe';



@Injectable()
export class SubscriptionService {

  //& CREATE PAYMENT BY BKASH
  async subscription(payload: SubscriptionDto, user: AuthenticatedUser) {

    const premiumPlan = await prisma.planTemplate.findUnique({
      where: {
        type_billingCycle: {
          type: PlanType.PREMIUM,
          billingCycle: payload.billingCycle
        }
      },
    });

    if (!premiumPlan) {
      throw new NotFoundException('No premium plan exists')
    }

    const isPlan = await prisma.plan.findUnique({
      where: {
        userId: user.id
      }
    })

    if (!isPlan) {
      throw new BadGatewayException('For subscription need to plan')
    }

    const planTemplate = await prisma.planTemplate.findUnique({
      where: {
        type_billingCycle: {
          type: PlanType.PREMIUM,
          billingCycle: payload.billingCycle
        }
      }
    })

    if (!planTemplate) {
      throw new BadGatewayException('This subscription type not exist')
    }

    const id_token = await getBkashIdToken();

    if (!id_token) {
      throw new BadGatewayException("bkash id token failed");
    }
    const amount = premiumPlan.price.toString()


    const merchantInvoiceNumber = `SUB-${randomUUID()}`;

    //* create bkash payment url
    const createPayment = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          authorization: id_token,
          "x-app-key": config.bkash_app_key,
        },
        body: JSON.stringify({
          agreementID: "TokenizedMerchant01L3IKB6H1565072174986",
          mode: "0011",
          payerReference: user.email,
          callbackURL: `${config.bkash_callback_url}/subscription/bkash/callback`,
          merchantAssociationInfo: "MI05MID54RF09123456One",
          amount,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: merchantInvoiceNumber,
        }),
      },
    );

    const result = await createPayment.json()

    await prisma.$transaction(
      async (tx) => {
        const subscription = await tx.subscription.create({
          data: {
            type: payload.billingCycle,
            currentPeriodStart: new Date(),
            userId: user.id,
            planId: isPlan.id,
            planTemplateId: planTemplate.id
          }
        })

        await tx.payment.create({
          data: {
            amount,
            currency: 'BDT',
            method: PaymentMethod.BKASH,
            bKashPaymentId: result.paymentID,
            merchantInvoiceNumber,
            payerReference: user.email,
            status: PaymentStatus.PENDING,
            subscriptionId: subscription.id,
          }
        })
      },
      {
        maxWait: 10000,
        timeout: 15000
      }
    )

    return result
  }


  //& BKASH CALLBACK
  async bKashCallback(query: Record<string, any>) {

    const transactionResult = await prisma.$transaction(
      async (tx) => {
        const id_token = await getBkashIdToken();

        if (!id_token) {
          throw new BadGatewayException("bkash id token failed");
        }
        const paymentID = query.paymentID;
        const status = query.status;

        console.log({
          "payment id": paymentID,
          status: status,
        });

        if (!paymentID) {
          throw new BadRequestException("Payment id missing");
        }

        if (!status) {
          throw new BadRequestException("status is missing");
        }
        if (status === "failure" || status === "cancel") {
          throw new BadGatewayException(`bKash payment ${status}! please try again`)
        }
        if (status === "success") {
          const executePayment = await fetch(
            `${config.bkash_base_url}/tokenized/checkout/execute`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                authorization: id_token,
                "x-app-key": config.bkash_app_key,
              },
              body: JSON.stringify({ paymentID }),
            },
          );
          const result = await executePayment.json();
          console.log("execute payment", result);

          const now = new Date()
          let currentPeriodEnd: Date;

          const udpatePayment = await tx.payment.update({
            where: {
              bKashPaymentId: paymentID,
            },
            data: {
              status: "PAID",
              paidAt: new Date(),
              transactionId: result.trxID,
            },
          });

          const subscription = await tx.subscription.findUnique({
            where: {
              id: udpatePayment.subscriptionId
            }
          })

          if (!subscription) {
            throw new NotFoundException('Subscription for payment not found');
          }

          if (subscription.type === SubscriptionType.YEARLY) {
            currentPeriodEnd = addYears(now, 1)
          }
          else {
            const monthAdd = subscription.type === SubscriptionType.HALF_YEARLY ? 6 : 1;

            currentPeriodEnd = addMonths(now, monthAdd)
          }


          await tx.subscription.update({
            where: {
              id: udpatePayment.subscriptionId
            },
            data: {
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd,
            }
          })

          const plan = await tx.plan.update({
            where: {
              id: subscription.planId
            },
            data: {
              planTemplateId: subscription.planTemplateId,
            },
            include: {
              user: true
            }
          })

          const pdfBuffer = await generateInvoicePdf({
            invoiceNumber: `INV-${result.trxID}`,
            customerName: plan.user.name,
            customerEmail: plan.user.email,
            planName: "Premium Plan",
            billingCycle: subscription.type,
            periodStart: subscription.currentPeriodStart,
            periodEnd: currentPeriodEnd,
            amount: result.amount,
            currency: "BDT",
            paymentMethod: "bKash",
            transactionId: result.trxID,
            paidAt: result.paymentExecuteTime,
          });


          await transporter.sendMail({
            from: config.smtp_sender,
            to: plan.user.email,
            subject:
              "Your Subscription Payment Invoice - Multiplex AI Agent",
            text: "Your payment is completed. Please find your invoice attached.",
            attachments: [
              {
                filename: "invoice.pdf",
                content: pdfBuffer,
              },
            ],
          });

          return {
            result,
            redirectUrl: `${config.frontend_url}/dashboard/?status=success`,
          };
        } else {
          throw new BadGatewayException("bkash callback error!");
        }
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );
    return transactionResult;
  }


  //& CRAETE CHECKOUT SESSION STRIPE
  async createCheckoutSession(payload: SubscriptionDto, user: AuthenticatedUser) {

    const premiumPlan = await prisma.planTemplate.findUnique({
      where: {
        type_billingCycle: {
          type: PlanType.PREMIUM,
          billingCycle: payload.billingCycle
        }
      },
    });

    if (!premiumPlan) {
      throw new NotFoundException('No premium plan exists')
    }

    const isPlan = await prisma.plan.findUnique({
      where: {
        userId: user.id
      }
    })

    if (!isPlan) {
      throw new BadGatewayException('For subscription need to plan')
    }

    const planTemplate = await prisma.planTemplate.findUnique({
      where: {
        type_billingCycle: {
          type: PlanType.PREMIUM,
          billingCycle: payload.billingCycle
        }
      }
    })

    if (!planTemplate) {
      throw new BadGatewayException('This subscription type not exist')
    }
    const amount = premiumPlan.price


    const transactionRes = await prisma.$transaction(
      async (tx) => {
        const subscription = await tx.subscription.create({
          data: {
            type: payload.billingCycle,
            currentPeriodStart: new Date(),
            userId: user.id,
            planId: isPlan.id,
            planTemplateId: planTemplate.id
          }
        })

        const payment = await tx.payment.create({
          data: {
            amount,
            currency: 'BDT',
            method: PaymentMethod.CARD,
            status: PaymentStatus.PENDING,
            subscriptionId: subscription.id,
          }
        })
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "bdt",
                unit_amount: Number(amount) * 100,
                product_data: {
                  name: `Subscription #${payload.billingCycle}`,
                  description: "Premium Subscription"
                }
              }
            }
          ],
          mode: "payment",
          payment_method_types: ["card"],
          success_url: `${config.frontend_url}/dashboard?success=true`,
          cancel_url: `${config.frontend_url}/dashboard?success=false`,
          metadata: {
            subscriptionId: subscription.id,
            paymentId: payment.id
          }
        });

        return session.url
      },
      {
        maxWait: 10000,
        timeout: 15000
      }
    )

    return transactionRes
  }


  //& STRIPE WEBHOOK
  async stripeWebhook(signature: string, payload: Buffer) {

    const endpointSecret = config.stripe_webhook_secret;

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret
    );

    console.log('event.............................', event)
    switch (event.type) {
      case "checkout.session.completed":
        console.log('seccess...')
        await paymentSuccess(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log("Unhandled Event");
    }
  };

  //& GET ALL SUBSCRIPTION (ADMIN)
  async getAllSubscription(query: IQuery) {

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

    const andConditions: SubscriptionWhereInput[] = []
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
            user: {
              is: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            user: {
              is: {
                email: { contains: search, mode: 'insensitive' }
              }
            }
          },
          {
            planTemplate: {
              is: {
                code: { contains: search, mode: 'insensitive' }
              }
            }
          },
        ],
      })
    }

    if (query.status !== undefined) {
      if (!Object.values(SubscriptionStatus).includes(query.status as SubscriptionStatus)) {
        throw new BadRequestException('Invalid subscription status')
      }
      andConditions.push({
        status: query.status as SubscriptionStatus
      })
    }

    if (query.type !== undefined) {
      if (!Object.values(SubscriptionType).includes(query.type as SubscriptionType)) {
        throw new BadRequestException('Invalid subscription type')
      }
      andConditions.push({ type: query.type as SubscriptionType })
    }

    const subscription = await prisma.subscription.findMany({
      where: {
        AND: andConditions
      },
      include: {
        payment: true
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sort]: order
      },
    })


    const total = await prisma.subscription.count({
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
      subscription,
      meta,
    };
  }


  //& GET MY SUBSCRIPTINS
  async getMySubscription(query: IQuery, user: AuthenticatedUser) {

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

    const andConditions: SubscriptionWhereInput[] = [
      {
        userId: user.id
      },
      {
        payment: {
          status: PaymentStatus.PAID
        }
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
          {
            user: {
              is: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            user: {
              is: {
                email: { contains: search, mode: 'insensitive' }
              }
            }
          },
          {
            planTemplate: {
              is: {
                code: { contains: search, mode: 'insensitive' }
              }
            }
          },
        ],
      })
    }

    if (query.status !== undefined) {
      if (!Object.values(SubscriptionStatus).includes(query.status as SubscriptionStatus)) {
        throw new BadRequestException('Invalid subscription status')
      }
      andConditions.push({
        status: query.status as SubscriptionStatus
      })
    }

    if (query.type !== undefined) {
      if (!Object.values(SubscriptionType).includes(query.type as SubscriptionType)) {
        throw new BadRequestException('Invalid subscription type')
      }
      andConditions.push({ type: query.type as SubscriptionType })
    }

    const subscription = await prisma.subscription.findMany({
      where: {
        AND: andConditions
      },
      include: {
        payment: true
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sort]: order
      },
    })


    const total = await prisma.subscription.count({
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
      subscription,
      meta,
    };
  }

}
