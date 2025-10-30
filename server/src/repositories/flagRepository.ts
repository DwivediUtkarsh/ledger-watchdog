/**
 * Flag repository
 * Handles all database operations for flags
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Flag, FlagInput, PaginatedResponse } from '@/types';
import { Prisma } from '@prisma/client';

export class FlagRepository {
  /**
   * Create a new flag
   */
  async create(
    data: FlagInput & {
      reporterHandle?: string;
      reporterVerified?: boolean;
      reporterIP?: string;
    }
  ): Promise<Flag> {
    try {
      const flag = await prisma.flag.create({
        data: {
          txSig: data.txSig,
          category: data.category,
          severity: data.severity,
          confidence: data.confidence,
          notes: data.notes,
          evidenceUrls: JSON.stringify(data.evidenceUrls),
          reporterHandle: data.reporterHandle,
          reporterVerified: data.reporterVerified || false,
          reporterIP: data.reporterIP,
        },
      });

      return this.transformFlag(flag);
    } catch (error) {
      logger.error('Failed to create flag', { error, data });
      throw error;
    }
  }

  /**
   * Find flag by ID
   */
  async findById(id: string): Promise<Flag | null> {
    try {
      const flag = await prisma.flag.findUnique({
        where: { id },
      });

      if (!flag) {
        return null;
      }

      return this.transformFlag(flag);
    } catch (error) {
      logger.error('Failed to find flag by ID', { error, id });
      throw error;
    }
  }

  /**
   * Find flags by transaction signature
   */
  async findByTransactionSig(txSig: string): Promise<Flag[]> {
    try {
      const flags = await prisma.flag.findMany({
        where: { txSig },
        orderBy: { createdAt: 'desc' },
      });

      return flags.map(this.transformFlag);
    } catch (error) {
      logger.error('Failed to find flags by transaction signature', { error, txSig });
      throw error;
    }
  }

  /**
   * Find flags with filtering and pagination
   */
  async findMany(query: {
    txSig?: string;
    status?: string;
    severity?: string;
    reporterHandle?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<Flag>> {
    try {
      const { txSig, status, severity, reporterHandle, limit = 50, cursor } = query;

      // Build where clause
      const where: Prisma.FlagWhereInput = {};

      if (txSig) where.txSig = txSig;
      if (status) where.status = status;
      if (severity) where.severity = severity as any;
      if (reporterHandle) where.reporterHandle = reporterHandle;

      // Cursor-based pagination
      if (cursor) {
        where.id = { lt: cursor };
      }

      // Execute query
      const flags = await prisma.flag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Take one extra to check if there are more results
      });

      // Check if there are more results
      const hasNext = flags.length > limit;
      if (hasNext) {
        flags.pop(); // Remove the extra record
      }

      // Get next cursor
      const nextCursor = hasNext ? flags[flags.length - 1]?.id : undefined;

      // Transform data
      const transformedFlags = flags.map(this.transformFlag);

      return {
        data: transformedFlags,
        pagination: {
          hasNext,
          nextCursor,
        },
      };
    } catch (error) {
      logger.error('Failed to find flags', { error, query });
      throw error;
    }
  }

  /**
   * Update flag status and review information
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'accepted' | 'rejected' | 'disputed',
    reviewData?: {
      reviewedBy: string;
      reviewNotes?: string;
      pointsAwarded?: number;
    }
  ): Promise<Flag | null> {
    try {
      const updateData: Prisma.FlagUpdateInput = {
        status,
        reviewedAt: new Date(),
      };

      if (reviewData) {
        updateData.reviewedBy = reviewData.reviewedBy;
        updateData.reviewNotes = reviewData.reviewNotes;
        updateData.pointsAwarded = reviewData.pointsAwarded;
      }

      const flag = await prisma.flag.update({
        where: { id },
        data: updateData,
      });

      return this.transformFlag(flag);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Flag not found
      }
      logger.error('Failed to update flag status', { error, id, status });
      throw error;
    }
  }

  /**
   * Delete a flag
   */
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.flag.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false; // Flag not found
      }
      logger.error('Failed to delete flag', { error, id });
      throw error;
    }
  }

  /**
   * Get flag statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    try {
      const [total, pending, accepted, rejected, byCategory, bySeverity] = await Promise.all([
        prisma.flag.count(),
        prisma.flag.count({ where: { status: 'pending' } }),
        prisma.flag.count({ where: { status: 'accepted' } }),
        prisma.flag.count({ where: { status: 'rejected' } }),
        prisma.flag.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        prisma.flag.groupBy({
          by: ['severity'],
          _count: { severity: true },
        }),
      ]);

      return {
        total,
        pending,
        accepted,
        rejected,
        byCategory: byCategory.reduce(
          (acc, item) => {
            acc[item.category] = item._count.category;
            return acc;
          },
          {} as Record<string, number>
        ),
        bySeverity: bySeverity.reduce(
          (acc, item) => {
            acc[item.severity] = item._count.severity;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    } catch (error) {
      logger.error('Failed to get flag stats', { error });
      throw error;
    }
  }

  /**
   * Get flags by reporter
   */
  async findByReporter(
    reporterHandle: string,
    limit: number = 50
  ): Promise<{ flags: Flag[]; stats: { total: number; accepted: number; rejected: number } }> {
    try {
      const [flags, total, accepted, rejected] = await Promise.all([
        prisma.flag.findMany({
          where: { reporterHandle },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.flag.count({ where: { reporterHandle } }),
        prisma.flag.count({ where: { reporterHandle, status: 'accepted' } }),
        prisma.flag.count({ where: { reporterHandle, status: 'rejected' } }),
      ]);

      return {
        flags: flags.map(this.transformFlag),
        stats: { total, accepted, rejected },
      };
    } catch (error) {
      logger.error('Failed to find flags by reporter', { error, reporterHandle });
      throw error;
    }
  }

  /**
   * Check if a transaction has been flagged by a specific reporter
   */
  async hasReporterFlagged(txSig: string, reporterHandle: string): Promise<boolean> {
    try {
      const count = await prisma.flag.count({
        where: {
          txSig,
          reporterHandle,
        },
      });

      return count > 0;
    } catch (error) {
      logger.error('Failed to check if reporter has flagged transaction', {
        error,
        txSig,
        reporterHandle,
      });
      throw error;
    }
  }

  /**
   * Transform database record to domain model
   */
  private transformFlag(dbFlag: any): Flag {
    return {
      id: dbFlag.id,
      txSig: dbFlag.txSig,
      category: dbFlag.category,
      severity: dbFlag.severity as 'low' | 'medium' | 'high',
      confidence: dbFlag.confidence,
      notes: dbFlag.notes,
      evidenceUrls: this.parseJsonField(dbFlag.evidenceUrls, []),
      status: dbFlag.status as 'pending' | 'accepted' | 'rejected' | 'disputed',
      reviewedAt: dbFlag.reviewedAt,
      reviewedBy: dbFlag.reviewedBy,
      reviewNotes: dbFlag.reviewNotes,
      reporterHandle: dbFlag.reporterHandle,
      reporterVerified: dbFlag.reporterVerified,
      reporterIP: dbFlag.reporterIP,
      pointsAwarded: dbFlag.pointsAwarded,
      createdAt: dbFlag.createdAt,
      updatedAt: dbFlag.updatedAt,
    };
  }

  /**
   * Safely parse JSON fields
   */
  private parseJsonField<T>(field: string | null, defaultValue: T): T {
    if (!field) return defaultValue;
    try {
      return JSON.parse(field);
    } catch {
      return defaultValue;
    }
  }
}

// Export singleton instance
export const flagRepository = new FlagRepository();




