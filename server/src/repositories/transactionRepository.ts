/**
 * Transaction repository
 * Handles all database operations for transactions
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Transaction, TransactionListQuery, PaginatedResponse } from '@/types';
import { Prisma } from '@prisma/client';

export class TransactionRepository {
  /**
   * Find transactions with filtering and pagination
   */
  async findMany(query: TransactionListQuery): Promise<PaginatedResponse<Transaction>> {
    try {
      const {
        query: searchQuery,
        minAmount,
        minRisk,
        limit = 50,
        cursor,
        sortBy = 'tsISO',
        sortOrder = 'desc',
      } = query;

      // Build where clause
      const where: Prisma.TransactionWhereInput = {};

      // Search query - search in signature, from, to, and labels
      if (searchQuery) {
        where.OR = [
          { sig: { contains: searchQuery } },
          { from: { contains: searchQuery } },
          { to: { contains: searchQuery } },
          { labels: { contains: searchQuery } },
        ];
      }

      // Amount filter
      if (minAmount !== undefined) {
        where.amountUSDT = { gte: minAmount };
      }

      // Risk filter
      if (minRisk !== undefined) {
        where.risk = { gte: minRisk };
      }

      // Cursor-based pagination
      if (cursor) {
        where.id = { lt: cursor };
      }

      // Build order by clause
      const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
      orderBy[sortBy] = sortOrder;

      // Execute query
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        take: limit + 1, // Take one extra to check if there are more results
      });

      // Check if there are more results
      const hasNext = transactions.length > limit;
      if (hasNext) {
        transactions.pop(); // Remove the extra record
      }

      // Get next cursor
      const nextCursor = hasNext ? transactions[transactions.length - 1]?.id : undefined;

      // Transform data (preserve `this` context)
      const transformedTransactions = transactions.map(tx => this.transformTransaction(tx));

      return {
        data: transformedTransactions,
        pagination: {
          hasNext,
          nextCursor,
        },
      };
    } catch (error) {
      logger.error('Failed to find transactions', { error, query });
      throw error;
    }
  }

  /**
   * Find a single transaction by signature
   */
  async findBySignature(sig: string): Promise<Transaction | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { sig },
      });

      if (!transaction) {
        return null;
      }

      return this.transformTransaction(transaction);
    } catch (error) {
      logger.error('Failed to find transaction by signature', { error, sig });
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          sig: data.sig,
          tsISO: data.tsISO,
          slot: data.slot,
          status: data.status,
          from: data.from,
          to: data.to,
          amountUSDT: data.amountUSDT,
          risk: data.risk,
          riskFactors: JSON.stringify(data.riskFactors),
          labels: JSON.stringify(data.labels),
          hints: JSON.stringify(data.hints),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      return this.transformTransaction(transaction);
    } catch (error) {
      logger.error('Failed to create transaction', { error, data });
      throw error;
    }
  }

  /**
   * Update an existing transaction
   */
  async update(
    sig: string,
    data: Partial<Omit<Transaction, 'id' | 'sig' | 'createdAt' | 'updatedAt'>>
  ): Promise<Transaction | null> {
    try {
      const updateData: Prisma.TransactionUpdateInput = {};

      if (data.tsISO) updateData.tsISO = data.tsISO;
      if (data.slot !== undefined) updateData.slot = data.slot;
      if (data.status) updateData.status = data.status;
      if (data.from) updateData.from = data.from;
      if (data.to) updateData.to = data.to;
      if (data.amountUSDT !== undefined) updateData.amountUSDT = data.amountUSDT;
      if (data.risk !== undefined) updateData.risk = data.risk;
      if (data.riskFactors) updateData.riskFactors = JSON.stringify(data.riskFactors);
      if (data.labels) updateData.labels = JSON.stringify(data.labels);
      if (data.hints) updateData.hints = JSON.stringify(data.hints);
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const transaction = await prisma.transaction.update({
        where: { sig },
        data: updateData,
      });

      return this.transformTransaction(transaction);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Transaction not found
      }
      logger.error('Failed to update transaction', { error, sig, data });
      throw error;
    }
  }

  /**
   * Delete a transaction
   */
  async delete(sig: string): Promise<boolean> {
    try {
      await prisma.transaction.delete({
        where: { sig },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false; // Transaction not found
      }
      logger.error('Failed to delete transaction', { error, sig });
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getStats(): Promise<{
    total: number;
    highRisk: number;
    totalVolume: number;
    avgRisk: number;
  }> {
    try {
      const [total, highRisk, volumeResult, avgRiskResult] = await Promise.all([
        prisma.transaction.count(),
        prisma.transaction.count({ where: { risk: { gte: 70 } } }),
        prisma.transaction.aggregate({ _sum: { amountUSDT: true } }),
        prisma.transaction.aggregate({ _avg: { risk: true } }),
      ]);

      return {
        total,
        highRisk,
        totalVolume: volumeResult._sum.amountUSDT || 0,
        avgRisk: Math.round(avgRiskResult._avg.risk || 0),
      };
    } catch (error) {
      logger.error('Failed to get transaction stats', { error });
      throw error;
    }
  }

  /**
   * Upsert transaction (create or update)
   */
  async upsert(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.upsert({
        where: { sig: data.sig },
        create: {
          sig: data.sig,
          tsISO: data.tsISO,
          slot: data.slot,
          status: data.status,
          from: data.from,
          to: data.to,
          amountUSDT: data.amountUSDT,
          risk: data.risk,
          riskFactors: JSON.stringify(data.riskFactors),
          labels: JSON.stringify(data.labels),
          hints: JSON.stringify(data.hints),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
        update: {
          tsISO: data.tsISO,
          slot: data.slot,
          status: data.status,
          from: data.from,
          to: data.to,
          amountUSDT: data.amountUSDT,
          risk: data.risk,
          riskFactors: JSON.stringify(data.riskFactors),
          labels: JSON.stringify(data.labels),
          hints: JSON.stringify(data.hints),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      return this.transformTransaction(transaction);
    } catch (error) {
      logger.error('Failed to upsert transaction', { error, data });
      throw error;
    }
  }

  /**
   * Transform database record to domain model
   */
  private transformTransaction(dbTransaction: any): Transaction {
    try {
      return {
        id: dbTransaction.id,
        sig: dbTransaction.sig,
        tsISO: dbTransaction.tsISO,
        slot: dbTransaction.slot ? dbTransaction.slot : undefined,
        status: dbTransaction.status,
        from: dbTransaction.from,
        to: dbTransaction.to,
        amountUSDT: parseFloat(dbTransaction.amountUSDT.toString()),
        risk: dbTransaction.risk,
        riskFactors: this.parseJsonField(dbTransaction.riskFactors, []),
        labels: this.parseJsonField(dbTransaction.labels, []),
        hints: this.parseJsonField(dbTransaction.hints, []),
        metadata: this.parseJsonField(dbTransaction.metadata, null),
        createdAt: dbTransaction.createdAt,
        updatedAt: dbTransaction.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to transform transaction', { error, dbTransaction });
      throw error;
    }
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
export const transactionRepository = new TransactionRepository();
