/**
 * Type definitions for Ledger Watchdog API
 * Shared types between frontend and backend
 */

import { z } from 'zod';

// ============================================================================
// Database Entity Types (matching Prisma models)
// ============================================================================

export interface Transaction {
  id: string;
  sig: string;
  tsISO: Date;
  slot?: number | null;
  status: string;
  from: string;
  to: string;
  amountUSDT: number;
  risk: number;
  riskFactors: string[]; // Parsed from JSON string
  labels: string[]; // Parsed from JSON string
  hints: string[]; // Parsed from JSON string
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flag {
  id: string;
  txSig: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  notes: string;
  evidenceUrls: string[]; // Parsed from JSON string
  status: 'pending' | 'accepted' | 'rejected' | 'disputed';
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  reporterHandle?: string | null;
  reporterVerified: boolean;
  reporterIP?: string | null;
  pointsAwarded?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Transaction API types
export interface TransactionListQuery {
  query?: string;
  minAmount?: number;
  minRisk?: number;
  limit?: number;
  cursor?: string;
  sortBy?: 'tsISO' | 'risk' | 'amountUSDT';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionResponse {
  id: string;
  sig: string;
  tsISO: string; // ISO string for API
  from: string;
  to: string;
  amountUSDT: number;
  risk: number;
  labels: string[];
  hints: string[];
  // Extended fields for details endpoint
  path?: TransactionPath[];
  riskHistory?: RiskPoint[];
}

export interface TransactionPath {
  address: string;
  type: 'wallet' | 'contract' | 'cex' | 'mixer';
  label?: string;
}

export interface RiskPoint {
  hop: number;
  risk: number;
  timestamp: string;
}

// Flag API types
export const FlagInputSchema = z.object({
  txSig: z.string().min(1, 'Transaction signature is required'),
  category: z.string().min(1, 'Category is required'),
  severity: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(10).max(100),
  notes: z.string().min(20, 'Notes must be at least 20 characters'),
  evidenceUrls: z.array(z.string().url()).max(5, 'Maximum 5 evidence URLs allowed'),
});

export type FlagInput = z.infer<typeof FlagInputSchema>;

export interface FlagResponse {
  id: string;
  txSig: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  notes: string;
  evidenceUrls: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'disputed';
  createdAt: string;
  pointsAwarded?: number;
}

// ============================================================================
// Filter and Pagination Types
// ============================================================================

export interface FilterState {
  query: string;
  minAmount: number;
  minRisk: number;
}

export interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasNext: boolean;
    nextCursor?: string;
    total?: number;
  };
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Solana/Blockchain Types
// ============================================================================

export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  meta: {
    err: unknown | null;
    fee: number;
    preBalances: number[];
    postBalances: number[];
  };
  transaction: {
    message: {
      accountKeys: string[];
      instructions: unknown[];
    };
  };
}

export interface TokenTransfer {
  signature: string;
  slot: number;
  timestamp: number;
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    ingestion?: boolean;
  };
  version: string;
}

// ============================================================================
// Constants
// ============================================================================

export const RISK_LEVELS = {
  LOW: { min: 0, max: 39, label: 'low' as const },
  MEDIUM: { min: 40, max: 69, label: 'medium' as const },
  HIGH: { min: 70, max: 89, label: 'high' as const },
  CRITICAL: { min: 90, max: 100, label: 'critical' as const },
} as const;

export const FLAG_CATEGORIES = [
  'Phishing / Fake Airdrop',
  'Mixer / Tumbler',
  'Bridge / Cross-chain',
  'MEV / Sandwich Attack',
  'Token Drainer',
  'Fake DEX',
  'Rug Pull',
  'Wash Trading',
  'Other Suspicious Activity',
] as const;
