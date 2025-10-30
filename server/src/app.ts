/**
 * Express application setup
 * Configures middleware, routes, and error handling
 */

import express from 'express';
import { config } from '@/config';
import { logger } from '@/lib/logger';

// Middleware imports
import {
  corsMiddleware,
  securityMiddleware,
  generalRateLimit,
  requestIdMiddleware,
  requestLoggingMiddleware,
  ipMiddleware,
  validateContentType,
  requestSizeLimit,
} from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Route imports
import { transactionRouter } from '@/routes/transactions';
import { flagRouter } from '@/routes/flags';
// import { webhookRouter } from '@/routes/webhooks'; // Will be created in next step

// Create Express application
const app = express();

// ============================================================================
// Global Middleware
// ============================================================================

// Trust proxy (for rate limiting and IP detection behind reverse proxies)
app.set('trust proxy', config.nodeEnv === 'production');

// Request ID and IP extraction
app.use(requestIdMiddleware);
app.use(ipMiddleware);

// Security middleware
app.use(securityMiddleware);
app.use(corsMiddleware);

// Request logging
app.use(requestLoggingMiddleware);

// Rate limiting
app.use(generalRateLimit);

// Custom JSON serializer to handle BigInt
const jsonReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Override JSON.stringify to handle BigInt
app.set('json replacer', jsonReplacer);

// Content type validation for POST/PUT requests
app.use(validateContentType());
app.use(requestSizeLimit('10mb'));

// ============================================================================
// Health Check Route (inline for now)
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: true, // Will implement proper check later
        ingestion: config.ingestionEnabled,
      },
      version: config.apiVersion,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.status(200).json({
      success: true,
      data: health,
      meta: {
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service unhealthy',
      },
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

// API version prefix
const apiPrefix = `/api/${config.apiVersion}`;

// Placeholder routes (will be implemented in next steps)
app.get(apiPrefix, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Ledger Watchdog API',
      version: config.apiVersion,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        transactions: `${apiPrefix}/transactions`,
        flags: `${apiPrefix}/flags`,
        webhooks: `${apiPrefix}/webhooks`,
      },
    },
  });
});

// Mount route handlers
app.use(apiPrefix + '/transactions', transactionRouter);
app.use(apiPrefix + '/flags', flagRouter);
// app.use(apiPrefix + '/webhooks', webhookRouter); // Will be added in next step

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Graceful Shutdown
// ============================================================================

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  // Close server and cleanup resources
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

export { app };
