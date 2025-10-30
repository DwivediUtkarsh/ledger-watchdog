/**
 * Configuration management for Ledger Watchdog API
 * Centralizes all environment variables and configuration
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema with validation
const configSchema = z.object({
  // Server configuration
  port: z.coerce.number().min(1000).max(65535).default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  apiVersion: z.string().default('v1'),

  // Database
  databaseUrl: z.string().min(1),

  // Solana configuration
  solanaRpcUrl: z.string().url(),
  usdtMint: z.string().min(32).max(44), // Solana address length

  // Helius configuration (optional)
  heliusApiKey: z.string().optional(),
  heliusWebhookSecret: z.string().optional(),

  // Security
  corsOrigin: z.string().default('http://localhost:5173'),
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(100),

  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  logFormat: z.enum(['json', 'simple']).default('json'),

  // Ingestion
  ingestionEnabled: z.coerce.boolean().default(true),
  ingestionIntervalMs: z.coerce.number().default(30000), // 30 seconds
  ingestionBatchSize: z.coerce.number().default(100),
});

// Parse and validate configuration
const parseConfig = () => {
  try {
    return configSchema.parse({
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      apiVersion: process.env.API_VERSION,
      databaseUrl: process.env.DATABASE_URL,
      solanaRpcUrl: process.env.SOLANA_RPC_URL,
      usdtMint: process.env.USDT_MINT,
      heliusApiKey: process.env.HELIUS_API_KEY,
      heliusWebhookSecret: process.env.HELIUS_WEBHOOK_SECRET,
      corsOrigin: process.env.CORS_ORIGIN,
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
      logLevel: process.env.LOG_LEVEL,
      logFormat: process.env.LOG_FORMAT,
      ingestionEnabled: process.env.INGESTION_ENABLED,
      ingestionIntervalMs: process.env.INGESTION_INTERVAL_MS,
      ingestionBatchSize: process.env.INGESTION_BATCH_SIZE,
    });
  } catch (error) {
    console.error('❌ Invalid configuration:', error);
    process.exit(1);
  }
};

export const config = parseConfig();

// Type export for use in other modules
export type Config = z.infer<typeof configSchema>;

// Helper functions
export const isDevelopment = () => config.nodeEnv === 'development';
export const isProduction = () => config.nodeEnv === 'production';
export const isTest = () => config.nodeEnv === 'test';
