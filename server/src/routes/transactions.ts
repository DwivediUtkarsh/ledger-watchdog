/**
 * Transaction routes
 * Handles all transaction-related API endpoints
 */

import { Router } from 'express';
import { transactionService } from '@/services/transactionService';
import { solanaService } from '@/services/solanaService';
import { flagService } from '@/services/flagService';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateSolanaSignatureParam } from '@/middleware/validation';
import { ApiResponse } from '@/types';
import { logger } from '@/lib/logger';
import { config } from '@/config';

const router = Router();

/**
 * GET /api/v1/transactions
 * Get transactions with filtering and pagination
 */
// Live, no-DB feed from RPC (USDT only). Use this endpoint for the frontend feed.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const lookbackSec = req.query.lookback ? Number(req.query.lookback) : 86400; // 24 hours default

    logger.debug('GET /transactions (live RPC feed)', { limit, lookbackSec });

    const events = await solanaService.fetchRecentUsdtTransfers(limit, lookbackSec);

    const data = events.map(ev => ({
      id: ev.signature,
      sig: ev.signature,
      tsISO: ev.blockTime ? new Date(ev.blockTime * 1000).toISOString() : new Date().toISOString(),
      from: ev.source ?? 'unknown',
      to: ev.destination ?? 'unknown',
      amountUSDT: ev.amount ?? 0,
      risk: 0,
      labels: [],
      hints: [],
    }));

    logger.info('Returning USDT transactions', { count: data.length, lookbackHours: lookbackSec / 3600 });

    const response: ApiResponse = {
      success: true,
      data: { data, pagination: { hasNext: false } },
      meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] as string, version: 'v1' },
    };
    res.json(response);
  })
);

/**
 * GET /api/v1/transactions/debug
 * Debug endpoint to test RPC connection and configuration
 */
router.get(
  '/debug',
  asyncHandler(async (_req, res) => {
    try {
      const debugInfo: any = {
        config: {
          solanaRpcUrl: config.solanaRpcUrl,
          usdtMint: config.usdtMint,
          nodeEnv: config.nodeEnv,
        },
        rpcTest: null,
        error: null,
      };

      // Test basic RPC connection
      try {
        const rpcResponse = await fetch(config.solanaRpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [] }),
        });
        const rpcData = await rpcResponse.json();
        debugInfo.rpcTest = {
          status: rpcResponse.status,
          currentSlot: rpcData.result,
          error: rpcData.error,
        };
      } catch (error: any) {
        debugInfo.error = error.message;
      }

      res.json({
        success: true,
        data: debugInfo,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error('Debug endpoint failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  })
);

/**
 * GET /api/v1/transactions/stats
 * Get transaction statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    logger.debug('GET /transactions/stats');

    const stats = await transactionService.getTransactionStats();

    const response: ApiResponse = {
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        version: 'v1',
      },
    };

    res.json(response);
  })
);

/**
 * GET /api/v1/transactions/:sig
 * Get a specific transaction by signature (DB first, RPC fallback)
 */
router.get(
  '/:sig',
  validateSolanaSignatureParam('sig'),
  asyncHandler(async (req, res) => {
    const { sig } = req.params;

    logger.debug('GET /transactions/:sig', { sig });

    // Try DB first (for flagged transactions)
    let transaction;
    try {
      transaction = await transactionService.getTransactionBySignature(sig);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        // Fallback to RPC for live transactions not in DB
        logger.debug('Transaction not in DB, fetching from RPC', { sig });
        const rpcTx = await solanaService.fetchTransactionBySignature(sig);
        if (rpcTx && rpcTx.from && rpcTx.to && rpcTx.amountUSDT) {
          transaction = {
            id: rpcTx.signature,
            sig: rpcTx.signature,
            tsISO: rpcTx.tsISO,
            slot: rpcTx.slot,
            status: 'confirmed',
            from: rpcTx.from,
            to: rpcTx.to,
            amountUSDT: rpcTx.amountUSDT,
            risk: 0,
            riskFactors: [],
            labels: [],
            hints: [],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } else {
          throw error; // Re-throw if RPC also fails
        }
      } else {
        throw error; // Re-throw non-404 errors
      }
    }

    const response: ApiResponse = {
      success: true,
      data: transaction,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        version: 'v1',
      },
    };

    res.json(response);
  })
);

/**
 * GET /api/v1/transactions/:sig/flags
 * Get all flags for a specific transaction
 */
router.get(
  '/:sig/flags',
  validateSolanaSignatureParam('sig'),
  asyncHandler(async (req, res) => {
    const { sig } = req.params;

    logger.debug('GET /transactions/:sig/flags', { sig });

    const flags = await flagService.getFlagsByTransaction(sig);

    const response: ApiResponse = {
      success: true,
      data: flags,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        version: 'v1',
      },
    };

    res.json(response);
  })
);

export { router as transactionRouter };
