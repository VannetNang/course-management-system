import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import config from './config';

const adapter = new PrismaPg({ connectionString: config.database_url });
export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('DB Connected via Prisma');
  } catch (error) {
    const err =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error(`Database connection error: ${err}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};
