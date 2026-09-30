import { InternalServerErrorException } from "@nestjs/common";
import config from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from 'bcrypt'
import { PlanType, Role, SubscriptionType } from "../../../generated/prisma/enums.js";
import { MODEL_ALLOWED } from "../lib/groq.js";
import { encryptApiKey } from "../lib/crypto.js";



export const seedTesterAdmin = async () => {
  try {
    const name = config.tester_admin_name;
    const email = config.tester_admin_email;
    const password = config.tester_admin_password;

    if (!name || !email || !password) {
      throw new InternalServerErrorException("no tester admin name, email, password",
      );
    }

    const existTesterAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existTesterAdmin) {
      console.log("tester admin already exists");
      return;
    }

    const hasPass = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const testerAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hasPass,
        emailVerified: true,
        role: Role.ADMIN,
      },
      omit: {
        password: true
      }
    });

    console.log("tester admin created", testerAdmin);

  }
  catch (error) {
    console.log("error", error);
    await prisma.user.delete({
      where: {
        email: config.tester_admin_email
      },
    });
  }
};


export const freeTemplate = async () => {
  return prisma.planTemplate.upsert({
    where: { code: 'FREE' },
    update: {
      type: PlanType.FREE,
      price: 0.00,
      billingCycle: null,
      isActive: true,
    },
    create: {
      type: PlanType.FREE,
      price: 0.00,
      code: 'FREE',
      billingCycle: null,
      isActive: true,
    },
  });
};


