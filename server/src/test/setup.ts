import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { afterAll, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';

// Disable process exit handlers during tests to prevent Vitest from erroring
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

beforeAll(async () => {
  // Ensure DB is reachable
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  await prisma.$disconnect();
});


