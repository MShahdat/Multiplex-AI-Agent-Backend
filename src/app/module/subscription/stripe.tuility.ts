import Stripe from "stripe";
import { stripe } from "../../lib/stripe.js";
import { prisma } from "../../lib/prisma.js";
import { NotFoundException } from "@nestjs/common";
import { PaymentMethod, SubscriptionStatus, SubscriptionType } from "../../../../generated/prisma/enums.js";
import { addMonths, addYears } from "date-fns";
import { generateInvoicePdf } from "../../utils/invoice.js";
import { transporter } from "../../lib/nodemailer.js";
import config from "../../config/index.js";

export const paymentSuccess = async (session: Stripe.Checkout.Session) => {
  try {
    console.log('webhook session ', session)
    console.log('payment method config details details =========', session.payment_method_configuration_details)
    console.log('payemnt method collection', session.payment_method_collection)

    const subscriptionId = session.metadata?.subscriptionId as string
    const paymentId = session.metadata?.paymentId as string
    const paymentIntentId = session.payment_intent as string

    const paymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntentId);

    const transactionRes = await prisma.$transaction(
      async (tx) => {
        const now = new Date()
        let currentPeriodEnd: Date;

        const udpatePayment = await tx.payment.update({
          where: {
            id: paymentId
          },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });

        const subscription = await tx.subscription.findUnique({
          where: {
            id: subscriptionId
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
            id: subscriptionId
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
          invoiceNumber: `INV-${paymentIntentId}`,
          customerName: plan.user.name,
          customerEmail: plan.user.email,
          planName: "Premium Plan",
          billingCycle: subscription.type,
          periodStart: subscription.currentPeriodStart,
          periodEnd: currentPeriodEnd,
          amount: udpatePayment.amount.toString(),
          currency: "BDT",
          paymentMethod: PaymentMethod.CARD,
          paymentIntentId,
          paidAt: new Date(),
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

      });

    return
  }
  catch (err) {
    console.error("paymentSuccess ERROR");
    console.error(err);
    throw err;
  }
};