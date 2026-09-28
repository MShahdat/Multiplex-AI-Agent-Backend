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

const PREMIUM_TEMPLATES = [
  {
    code: 'PREMIUM_MONTHLY',
    billingCycle: SubscriptionType.MONTHLY,
    price: 500
  },
  {
    code: 'PREMIUM_HALF_YEARLY',
    billingCycle: SubscriptionType.HALF_YEARLY,
    price: 2500
  },
  {
    code: 'PREMIUM_YEARLY',
    billingCycle: SubscriptionType.YEARLY,
    price: 4500
  }
] as const

export const premiumTemplates = async () => {
  for (const t of PREMIUM_TEMPLATES) {
    await prisma.planTemplate.upsert({
      where: {
        type_billingCycle: {
          type: PlanType.PREMIUM,
          billingCycle: t.billingCycle,
        },
      },
      update: {
        code: t.code,
        price: t.price,
        isActive: true
      },
      create: {
        code: t.code,
        type: PlanType.PREMIUM,
        billingCycle: t.billingCycle,
        price: t.price,
        isActive: true,
      },
    });
  }
};


export const providers = async () => {
  for (const item of MODEL_ALLOWED) {
    const { iv, authTag, encryptKey } = encryptApiKey(config.groq_api_key);
    await prisma.aiProvider.upsert({
      where: { model: item.model },
      update: {
        name: item.name,
        type: item.type,
        isPremium: (item as any).isPremium ?? false, // flips safeguard to true
        isEnabled: true,
        isDefault: item.model === "qwen/qwen3.8-27b",
      },
      create: {
        name: item.name,
        model: item.model,
        type: item.type,
        isPremium: (item as any).isPremium ?? false,
        encryptedApiKey: encryptKey, iv, authTag,
        isDefault: item.model === "qwen/qwen3.8-27b",
      },
    });
  }
};

const FREE_LIMIT = {
  requestPerMinute: 10,
  requestPerDay: 100,
  tokenPerMinute: 4000,
  tokenPerDay: 100000,
  maxTokensPerRequest: 2048
};

const PREMIUM_LIMIT = {
  requestPerMinute: 30,
  requestPerDay: 1000,
  tokenPerMinute: 8000,
  tokenPerDay: 200000,
  maxTokensPerRequest: 2048
};


const FREE_MODELS = MODEL_ALLOWED.filter(m => !m.isPremium).map(m => m.model);
const PREMIUM_MODELS = MODEL_ALLOWED.filter(m => m.isPremium).map(m => m.model);

const PREMIUM_ACCESS_MODELS = [...FREE_MODELS, ...PREMIUM_MODELS];

const PREMIUM_CODES = ["PREMIUM_MONTHLY", "PREMIUM_HALF_YEARLY", "PREMIUM_YEARLY"] as const;



export const planProviderLimits = async () => {
  const templates = await prisma.planTemplate.findMany();
  const providersList = await prisma.aiProvider.findMany();


  const tByCode: Record<string, (typeof templates)[number]> = {};
  for (const t of templates) tByCode[t.code] = t;

  const pByModel: Record<string, (typeof providersList)[number]> = {};
  for (const p of providersList) pByModel[p.model] = p;

  if (!tByCode['FREE']) { console.log('FREE missing'); return; }


  for (const premiumModel of PREMIUM_MODELS) {
    const p = pByModel[premiumModel];
    if (p) await prisma.planProviderLimit.deleteMany({
      where: { planTemplateId: tByCode['FREE'].id, aiProviderId: p.id }
    });
  }


  for (const model of FREE_MODELS) {
    const t = tByCode['FREE']; const p = pByModel[model];
    if (!t || !p) { console.log(`skip FREE ${model}`); continue; }
    await prisma.planProviderLimit.upsert({
      where: { planTemplateId_aiProviderId: { planTemplateId: t.id, aiProviderId: p.id } },
      update: { ...FREE_LIMIT },
      create: { planTemplateId: t.id, aiProviderId: p.id, ...FREE_LIMIT },
    });
  }

  for (const code of PREMIUM_CODES) {
    const t = tByCode[code];
    if (!t) { console.log(`skip missing template ${code}`); continue; }
    for (const model of PREMIUM_ACCESS_MODELS) {
      const p = pByModel[model];
      if (!p) { console.log(`skip ${code} ${model}`); continue; }
      await prisma.planProviderLimit.upsert({
        where: { planTemplateId_aiProviderId: { planTemplateId: t.id, aiProviderId: p.id } },
        update: { ...PREMIUM_LIMIT },
        create: { planTemplateId: t.id, aiProviderId: p.id, ...PREMIUM_LIMIT },
      });
    }
  }
  console.log('Limits ensured: FREE x free-only, PREMIUM_* x all');
};

