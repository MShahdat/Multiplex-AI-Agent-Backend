import cron from "node-cron";
import { prisma } from "./prisma.js";
import { PaymentStatus, Role, SubscriptionStatus, UserStatus } from "../../../generated/prisma/enums.js";


//& REMOVE DELETED USER FROM DB 1 MONTH INTERVAL
export const deleteUserFromDB = async () => {
  cron.schedule("0 0 1 * * ", async () => {
    try {
      const oneMonthAgo = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
      const deleteUser = await prisma.user.deleteMany({
        where: {
          role: Role.USER,
          deletedAt: { lt: oneMonthAgo },
          status: UserStatus.DELETED
        },
      });

      if (deleteUser.count > 0) {
        console.log(
          `Cron: Deleted ${deleteUser.count} deleted used older then 1 month`,
        );
      }
    } catch (error) {
      console.log(`Cron: Failed to remove delted user`, error);
    }

    console.log("Deleted user remove cron schedule trigger");
  });
};



//& DELETE DRAFT SUBSCRIPTION & PENDING PAYEMNT FROM DB 1 HOUR INTERVAL
export const deleteSubscriptionPaymentFromDB = async () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deleteSubscription = await prisma.subscription.deleteMany({
        where: {
          status: SubscriptionStatus.DRAFT,
          createdAt: {
            lt: oneHourAgo
          },
        },
      });

      if (deleteSubscription.count > 0) {
        console.log(
          `Cron: Deleted ${deleteSubscription.count} deleted subscription older then 1 hour`,
        );
      }

      const deletePayment = await prisma.payment.deleteMany({
        where: {
          createdAt: {
            lt: oneHourAgo
          },
          status: PaymentStatus.PENDING,

        },
      });

      if (deletePayment.count > 0) {
        console.log(
          `Cron: Deleted ${deletePayment.count} deleted payment older then 1 hour`,
        );
      }
    } catch (error) {
      console.log(`Cron: Failed to remove delted user`, error);
    }

    console.log("Deleted subscription & payment remove cron schedule trigger");
  });
};
