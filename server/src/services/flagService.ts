/**
 * Flag service
 * Business logic for flag operations
 */

import { flagRepository } from '@/repositories/flagRepository';
import { transactionRepository } from '@/repositories/transactionRepository';
import { logger } from '@/lib/logger';
import { Flag, FlagInput, FlagResponse, PaginatedResponse } from '@/types';
import { NotFoundError, ValidationError, ConflictError } from '@/middleware/errorHandler';

export class FlagService {
  /**
   * Submit a new flag
   */
  async submitFlag(
    data: FlagInput,
    metadata?: {
      reporterHandle?: string;
      reporterVerified?: boolean;
      reporterIP?: string;
    }
  ): Promise<{ flag: FlagResponse; points: number }> {
    try {
      logger.debug('Submitting flag', { txSig: data.txSig, category: data.category });

      // Verify transaction exists (it should exist if we created it in the route handler)
      const transaction = await transactionRepository.findBySignature(data.txSig);
      if (!transaction) {
        throw new NotFoundError('Transaction not found. Please ensure the transaction signature is valid.');
      }

      // Check if reporter has already flagged this transaction
      if (metadata?.reporterHandle) {
        const hasAlreadyFlagged = await flagRepository.hasReporterFlagged(
          data.txSig,
          metadata.reporterHandle
        );
        if (hasAlreadyFlagged) {
          throw new ConflictError('You have already flagged this transaction');
        }
      }

      // Create the flag
      const flag = await flagRepository.create({
        ...data,
        reporterHandle: metadata?.reporterHandle,
        reporterVerified: metadata?.reporterVerified || false,
        reporterIP: metadata?.reporterIP,
      });

      // Calculate points (simplified implementation)
      const points = this.calculatePoints(data, metadata?.reporterVerified || false);

      logger.info('Flag submitted', {
        flagId: flag.id,
        txSig: data.txSig,
        category: data.category,
        severity: data.severity,
        points,
      });

      return {
        flag: this.transformToResponse(flag),
        points,
      };
    } catch (error) {
      logger.error('Failed to submit flag', { error, data });
      throw error;
    }
  }

  /**
   * Get flag by ID
   */
  async getFlagById(id: string): Promise<FlagResponse> {
    try {
      logger.debug('Getting flag by ID', { id });

      const flag = await flagRepository.findById(id);

      if (!flag) {
        throw new NotFoundError('Flag');
      }

      return this.transformToResponse(flag);
    } catch (error) {
      logger.error('Failed to get flag by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get flags for a transaction
   */
  async getFlagsByTransaction(txSig: string): Promise<FlagResponse[]> {
    try {
      logger.debug('Getting flags by transaction', { txSig });

      // Verify transaction exists
      const transaction = await transactionRepository.findBySignature(txSig);
      if (!transaction) {
        throw new NotFoundError('Transaction');
      }

      const flags = await flagRepository.findByTransactionSig(txSig);

      return flags.map(this.transformToResponse);
    } catch (error) {
      logger.error('Failed to get flags by transaction', { error, txSig });
      throw error;
    }
  }

  /**
   * Get flags with filtering and pagination
   */
  async getFlags(query: {
    txSig?: string;
    status?: string;
    severity?: string;
    reporterHandle?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<FlagResponse>> {
    try {
      logger.debug('Getting flags', { query });

      const result = await flagRepository.findMany(query);

      // Transform to API response format
      const transformedData = result.data.map(this.transformToResponse);

      return {
        data: transformedData,
        pagination: result.pagination,
      };
    } catch (error) {
      logger.error('Failed to get flags', { error, query });
      throw error;
    }
  }

  /**
   * Update flag status (for moderation)
   */
  async updateFlagStatus(
    id: string,
    status: 'pending' | 'accepted' | 'rejected' | 'disputed',
    reviewData?: {
      reviewedBy: string;
      reviewNotes?: string;
      pointsAwarded?: number;
    }
  ): Promise<FlagResponse> {
    try {
      logger.debug('Updating flag status', { id, status });

      const flag = await flagRepository.updateStatus(id, status, reviewData);

      if (!flag) {
        throw new NotFoundError('Flag');
      }

      logger.info('Flag status updated', {
        flagId: id,
        status,
        reviewedBy: reviewData?.reviewedBy,
      });

      return this.transformToResponse(flag);
    } catch (error) {
      logger.error('Failed to update flag status', { error, id, status });
      throw error;
    }
  }

  /**
   * Get flag statistics
   */
  async getFlagStats() {
    try {
      logger.debug('Getting flag statistics');

      const stats = await flagRepository.getStats();

      return {
        total: stats.total,
        pending: stats.pending,
        accepted: stats.accepted,
        rejected: stats.rejected,
        acceptanceRate: stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0,
        byCategory: stats.byCategory,
        bySeverity: stats.bySeverity,
      };
    } catch (error) {
      logger.error('Failed to get flag statistics', { error });
      throw error;
    }
  }

  /**
   * Get flags by reporter
   */
  async getFlagsByReporter(reporterHandle: string, limit: number = 50) {
    try {
      logger.debug('Getting flags by reporter', { reporterHandle });

      const result = await flagRepository.findByReporter(reporterHandle, limit);

      return {
        flags: result.flags.map(this.transformToResponse),
        stats: {
          ...result.stats,
          accuracyRate:
            result.stats.total > 0
              ? Math.round((result.stats.accepted / result.stats.total) * 100)
              : 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get flags by reporter', { error, reporterHandle });
      throw error;
    }
  }

  /**
   * Delete a flag (admin only)
   */
  async deleteFlag(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting flag', { id });

      const deleted = await flagRepository.delete(id);

      if (deleted) {
        logger.info('Flag deleted', { flagId: id });
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete flag', { error, id });
      throw error;
    }
  }

  /**
   * Transform flag to API response format
   */
  private transformToResponse(flag: Flag): FlagResponse {
    return {
      id: flag.id,
      txSig: flag.txSig,
      category: flag.category,
      severity: flag.severity,
      confidence: flag.confidence,
      notes: flag.notes,
      evidenceUrls: flag.evidenceUrls,
      status: flag.status,
      createdAt: flag.createdAt.toISOString(),
      pointsAwarded: flag.pointsAwarded || undefined,
    };
  }

  /**
   * Calculate points for a flag submission
   */
  private calculatePoints(flag: FlagInput, isVerified: boolean): number {
    // Base points by severity
    const basePoints = {
      low: 12,
      medium: 25,
      high: 40,
    };

    // Confidence multiplier (0.4 to 1.6)
    const confidenceMultiplier = (flag.confidence / 100) * 1.2 + 0.4;

    // Calculate base score
    let points = basePoints[flag.severity] * confidenceMultiplier;

    // Verification bonus/penalty
    if (!isVerified) {
      points *= 0.3; // Unverified users get 30% of points
    }

    // Evidence bonus
    if (flag.evidenceUrls.length > 0) {
      points *= 1.1; // 10% bonus for providing evidence
    }

    // Detailed notes bonus
    if (flag.notes.length > 100) {
      points *= 1.05; // 5% bonus for detailed analysis
    }

    return Math.round(points);
  }

  /**
   * Validate flag input
   */
  validateFlagInput(data: FlagInput): void {
    if (!data.txSig || data.txSig.length < 80) {
      throw new ValidationError('Invalid transaction signature');
    }

    if (!data.category || data.category.trim().length === 0) {
      throw new ValidationError('Category is required');
    }

    if (!['low', 'medium', 'high'].includes(data.severity)) {
      throw new ValidationError('Invalid severity level');
    }

    if (data.confidence < 10 || data.confidence > 100) {
      throw new ValidationError('Confidence must be between 10 and 100');
    }

    if (!data.notes || data.notes.trim().length < 20) {
      throw new ValidationError('Notes must be at least 20 characters');
    }

    if (data.evidenceUrls.length > 5) {
      throw new ValidationError('Maximum 5 evidence URLs allowed');
    }

    // Validate evidence URLs
    for (const url of data.evidenceUrls) {
      try {
        new URL(url);
      } catch {
        throw new ValidationError(`Invalid evidence URL: ${url}`);
      }
    }
  }
}

// Export singleton instance
export const flagService = new FlagService();
