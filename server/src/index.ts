/**
 * Application entry point
 * Starts the Express server and initializes services
 */

import { app } from './app';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { prisma, checkDatabaseHealth } from '@/lib/prisma';

// ============================================================================
// Server Startup
// ============================================================================

const startServer = async (): Promise<void> => {
  try {
    // Log startup information
    logger.info('Starting Ledger Watchdog API Server', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      version: config.apiVersion,
    });

    // Check database connection
    logger.info('Checking database connection...');
    const dbHealthy = await checkDatabaseHealth();
    
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    
    logger.info('Database connection established');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`, {
        environment: config.nodeEnv,
        apiUrl: `http://localhost:${config.port}/api/${config.apiVersion}`,
        healthCheck: `http://localhost:${config.port}/health`,
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      process.exit(1);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      // Close HTTP server
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connection
        await prisma.$disconnect();
        logger.info('Database connection closed');
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// ============================================================================
// Initialize Application
// ============================================================================

// Start the server
startServer().catch((error) => {
  logger.error('Startup error', { error });
  process.exit(1);
});

// Export for testing
export { app };




