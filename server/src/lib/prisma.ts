/**
 * Prisma client singleton
 * Manages database connection and provides typed database access
 */

import { PrismaClient } from '@prisma/client';
import { config, isDevelopment } from '@/config';
import { logger } from './logger';

// Global variable to store Prisma client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with logging configuration
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: isDevelopment()
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });

  // Set up logging event handlers
  if (isDevelopment()) {
    client.$on('query', e => {
      logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  client.$on('error', e => {
    logger.error('Database Error', { error: e });
  });

  client.$on('info', e => {
    logger.info('Database Info', { message: e.message });
  });

  client.$on('warn', e => {
    logger.warn('Database Warning', { message: e.message });
  });

  return client;
};

// Use singleton pattern to avoid multiple connections
const prisma = globalThis.__prisma ?? createPrismaClient();

if (isDevelopment()) {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Closing database connection...');
  await prisma.$disconnect();
  logger.info('Database connection closed');
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export { prisma };

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
};

// Database connection info
export const getDatabaseInfo = async () => {
  try {
    const result = await prisma.$queryRaw`SELECT sqlite_version() as version`;
    return result;
  } catch (error) {
    logger.error('Failed to get database info', { error });
    return null;
  }
};




