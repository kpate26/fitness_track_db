import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export default prisma;
