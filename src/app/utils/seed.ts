import { InternalServerErrorException } from "@nestjs/common";
import config from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from 'bcrypt'
import { PlanType, Role } from "../../../generated/prisma/enums.js";
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
  const isTemp = await prisma.planTemplate.findUnique({
    where: {
      type: PlanType.FREE
    }
  })

  if (isTemp) {
    console.log('Free plan templete alredy exists')
    return
  }
  const planTemplate = await prisma.planTemplate.create({

    data: {
      type: PlanType.FREE,
      price: 0.00,
      status: true,
    },
  });

  return planTemplate;
};


export const providers = async () => {
  const seededProviders: any[] = [];

  for (const item of MODEL_ALLOWED) {
    const { iv, authTag, encryptKey } = encryptApiKey(config.groq_api_key);

    const isProvider = await prisma.aiProvider.findUnique({
      where: {
        model: item.model
      }
    })

    if (isProvider) {
      console.log(`${item.model} already exists`);
      continue
    }

    const provider = await prisma.aiProvider.create({
      data: {
        name: item.name,
        model: item.model,
        type: item.type,
        authTag,
        encryptedApiKey: encryptKey,
        iv,
        isDefault: item.model === 'qwen/qwen3.8-27b',
      },
    });

    seededProviders.push(provider);
  }

  return seededProviders;
};

export const providerTem = async () => {
  const freePlan = await prisma.planTemplate.findUnique({
    where: {
      type: PlanType.FREE
    }
  });

  if (!freePlan) {
    console.log('something went wrong')
    return
  }
  const availableProviders = await prisma.aiProvider.findMany();

  const qwen3827b = availableProviders.find((p: any) => p.model === 'qwen/qwen3.8-27b')
  const llama222 = availableProviders.find((p: any) => p.model === 'meta-llama/llama-prompt-guard-2-22m');
  const llama286 = availableProviders.find((p: any) => p.model === 'meta-llama/llama-prompt-guard-2-86m');
  const openai_gpt_120b = availableProviders.find((p: any) => p.model === 'openai/gpt-oss-120b');
  const openai_gpt_20b = availableProviders.find((p: any) => p.model === 'openai/gpt-oss-20b');
  const openai_gpt_safeguard_20b = availableProviders.find((p: any) => p.model === 'openai/gpt-oss-safeguard-20b');

  if (!qwen3827b || !llama222 || !llama286 || !openai_gpt_120b || !openai_gpt_20b || !openai_gpt_safeguard_20b) {
    throw new Error('Missing required AI providers for free plan limits.');
  }

  const limits = [
    {
      planTemplateId: freePlan.id,
      aiProviderId: qwen3827b.id,
      maxTokenPerRequest: 2048,
      requestPerDay: 1000,
      requestPerMin: 30,
      tokenPerDay: 200000,
      tokenPerMin: 8000,
    },
    {
      planTemplateId: freePlan.id,
      aiProviderId: llama222.id,
      maxTokenPerRequest: 2048,
      requestPerDay: 14400,
      requestPerMin: 30,
      tokenPerDay: 50000,
      tokenPerMin: 15000,
    },
    {
      planTemplateId: freePlan.id,
      aiProviderId: llama286.id,
      maxTokenPerRequest: 2048,
      requestPerDay: 14400,
      requestPerMin: 30,
      tokenPerDay: 50000,
      tokenPerMin: 15000,
    },
    {
      planTemplateId: freePlan.id,
      aiProviderId: openai_gpt_120b.id,
      maxTokenPerRequest: 2048,
      requestPerDay: 1000,
      requestPerMin: 30,
      tokenPerDay: 200000,
      tokenPerMin: 8000,
    },
    {
      planTemplateId: freePlan.id,
      aiProviderId: openai_gpt_20b.id,
      maxTokenPerRequest: 2048,
      requestPerDay: 1000,
      requestPerMin: 30,
      tokenPerDay: 200000,
      tokenPerMin: 8000,
    },
    {
      planTemplateId: freePlan.id,
      aiProviderId: openai_gpt_safeguard_20b.id,
      maxTokenPerRequest: 2048,
      requestPerDay: 1000,
      requestPerMin: 30,
      tokenPerDay: 200000,
      tokenPerMin: 8000,
    },
  ];

  for (const limit of limits) {

    const isLimit = await prisma.planProviderLimit.findUnique({
      where: {
        planTemplateId_aiProviderId: {
          planTemplateId: limit.planTemplateId,
          aiProviderId: limit.aiProviderId
        }
      }
    })

    if (isLimit) {
      // console.log(`already exists`)
      continue
    }

    await prisma.planProviderLimit.create({
      data: {
        requestPerDay: limit.requestPerDay,
        requestPerMinute: limit.requestPerMin,
        tokenPerDay: limit.tokenPerDay,
        tokenPerMinute: limit.tokenPerMin,
        maxTokensPerRequest: limit.maxTokenPerRequest,
        planTemplate: {
          connect: { id: limit.planTemplateId },
        },
        aiProvider: {
          connect: { id: limit.aiProviderId },
        },
      },
    });
  }
};






