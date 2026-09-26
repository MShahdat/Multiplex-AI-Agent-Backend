import cron from "node-cron";
import { prisma } from "./prisma.js";
import { Role, UserStatus } from "../../../generated/prisma/enums.js";


//& DELETE DELETED USER FROM DB 1 MONTH INTERVAL
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
