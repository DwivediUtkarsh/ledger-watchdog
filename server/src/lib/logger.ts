/**
 * Structured logging utility using Winston
 * Provides consistent logging across the application
 */

import winston from 'winston';
import { config } from '@/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// BigInt-safe JSON replacer for logging
const bigintSafeReplacer = (_key: string, value: unknown) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value as any;
};

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ledger-watchdog-api',
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        config.logFormat === 'simple'
          ? winston.format.simple()
          : winston.format.printf(({ timestamp, level, message, ...meta }) => {
              let metaStr = '';
              try {
                metaStr = Object.keys(meta).length
                  ? JSON.stringify(meta, bigintSafeReplacer, 2)
                  : '';
              } catch {
                // Fallback to toString if stringify fails
                metaStr = '[unserializable-meta]';
              }
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
      ),
    }),
  ],
});

// Add file transport in production
if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    })
  );
}

// Create typed logger interface
interface Logger {
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

const typedLogger: Logger = {
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
};

export { typedLogger as logger };

// Request logging middleware helper
export const createRequestLogger = () => {
  return winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const { req, res, responseTime } = meta;
    if (req && res) {
      return `${timestamp} [${level}]: ${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
    }
    return `${timestamp} [${level}]: ${message}`;
  });
};
