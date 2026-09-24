import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import config from './app/config/index.js';
import { prisma } from './app/lib/prisma.js';

const PORT = config.port || 5000;

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    prisma.$connect();
    console.log('Connected to the database successfully.');
    await app.listen(PORT, () => {
      console.log(`server is running port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
    prisma.$disconnect();
    process.exit(1);
  }
}
await bootstrap();
