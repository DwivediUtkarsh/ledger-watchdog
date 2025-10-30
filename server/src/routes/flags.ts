/**
 * Flag routes
 * Handles all flag-related API endpoints
 */

import { Router } from 'express';
import { flagService } from '@/services/flagService';
import { solanaService } from '@/services/solanaService';
import { asyncHandler } from '@/middleware/errorHandler';
import { flagSubmissionRateLimit } from '@/middleware/security';
import {
  validateFlagInput,
  validateFlagId,
  validatePagination,
  validate,
} from '@/middleware/validation';
import { ApiResponse } from '@/types';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/v1/flags
 * Submit a new flag
 */
router.post(
  '/',
  flagSubmissionRateLimit,
  validateFlagInput,
  asyncHandler(async (req, res) => {
    const flagData = req.body;
    const reporterIP = req.ip;

    logger.debug('POST /flags', { txSig: flagData.txSig, category: flagData.category });

    // Extract reporter information from headers or body
    const metadata = {
      reporterHandle: flagData.reporterHandle,
      reporterVerified: false, // TODO: Implement proper verification
      reporterIP,
    };

    // If transaction not in DB, fetch minimal info from RPC and create lightweight record
    // Note: we only persist on flag, not during feed
    // (Optional best-effort enrichment)
    try {
      const tx = await solanaService.fetchTransactionBySignature(flagData.txSig);
      if (tx && tx.from && tx.to && tx.amountUSDT) {
        // Create minimal transaction if missing
        // Using service upsert with conservative defaults
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (await import('@/services/transactionService')).transactionService.upsertTransaction({
          id: '',
          sig: tx.signature,
          tsISO: new Date(tx.tsISO),
          slot: tx.slot,
          status: 'confirmed',
          from: tx.from,
          to: tx.to,
          amountUSDT: tx.amountUSDT,
          risk: 0,
          riskFactors: [],
          labels: [],
          hints: [],
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    } catch (e) {
      // ignore enrichment errors
    }

    const result = await flagService.submitFlag(flagData, metadata);

    const response: ApiResponse = {
      success: true,
      data: {
        flag: result.flag,
        points: result.points,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        version: 'v1',
      },
    };

    res.status(201).json(response);
  })
);

/**
 * GET /api/v1/flags
 * Get flags with filtering and pagination
 */
router.get(
  '/',
  validatePagination,
  validate(
    z.object({
      txSig: z.string().optional(),
      status: z.enum(['pending', 'accepted', 'rejected', 'disputed']).optional(),
      severity: z.enum(['low', 'medium', 'high']).optional(),
      reporterHandle: z.string().optional(),
    }),
    'query'
  ),
  asyncHandler(async (req, res) => {
    const query = {
      ...req.query,
      limit: req.query.limit || 50,
    };

    logger.debug('GET /flags', { query });

    const result = await flagService.getFlags(query as any);

    const response: ApiResponse = {
      success: true,
      data: result,
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
 * GET /api/v1/flags/stats
 * Get flag statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    logger.debug('GET /flags/stats');

    const stats = await flagService.getFlagStats();

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
 * GET /api/v1/flags/reporter/:handle
 * Get flags by reporter handle
 */
router.get(
  '/reporter/:handle',
  validate(
    z.object({
      handle: z.string().min(1),
    }),
    'params'
  ),
  validate(
    z.object({
      limit: z.coerce.number().min(1).max(100).default(50),
    }),
    'query'
  ),
  asyncHandler(async (req, res) => {
    const { handle } = req.params;
    const { limit } = req.query;

    logger.debug('GET /flags/reporter/:handle', { handle, limit });

    const result = await flagService.getFlagsByReporter(handle, Number(limit));

    const response: ApiResponse = {
      success: true,
      data: result,
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
 * GET /api/v1/flags/:id
 * Get a specific flag by ID
 */
router.get(
  '/:id',
  validateFlagId,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.debug('GET /flags/:id', { id });

    const flag = await flagService.getFlagById(id);

    const response: ApiResponse = {
      success: true,
      data: flag,
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
 * PUT /api/v1/flags/:id/status
 * Update flag status (for moderation)
 */
router.put(
  '/:id/status',
  validateFlagId,
  validate(
    z.object({
      status: z.enum(['pending', 'accepted', 'rejected', 'disputed']),
      reviewedBy: z.string().min(1),
      reviewNotes: z.string().optional(),
      pointsAwarded: z.number().min(0).optional(),
    }),
    'body'
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reviewedBy, reviewNotes, pointsAwarded } = req.body;

    logger.debug('PUT /flags/:id/status', { id, status, reviewedBy });

    const flag = await flagService.updateFlagStatus(id, status, {
      reviewedBy,
      reviewNotes,
      pointsAwarded,
    });

    const response: ApiResponse = {
      success: true,
      data: flag,
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
 * DELETE /api/v1/flags/:id
 * Delete a flag (admin only)
 */
router.delete(
  '/:id',
  validateFlagId,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.debug('DELETE /flags/:id', { id });

    const deleted = await flagService.deleteFlag(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Flag not found',
        },
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        version: 'v1',
      },
    };

    res.json(response);
  })
);

export { router as flagRouter };
