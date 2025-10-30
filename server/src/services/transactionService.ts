/**
 * Transaction service
 * Business logic for transaction operations
 */

import { transactionRepository } from '@/repositories/transactionRepository';
import { logger } from '@/lib/logger';
import {
  Transaction,
  TransactionListQuery,
  TransactionResponse,
  TransactionPath,
  RiskPoint,
  PaginatedResponse,
} from '@/types';
import { NotFoundError } from '@/middleware/errorHandler';

export class TransactionService {
  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(query: TransactionListQuery): Promise<PaginatedResponse<TransactionResponse>> {
    try {
      logger.debug('Getting transactions', { query });

      const result = await transactionRepository.findMany(query);

      // Transform to API response format
      const transformedData = result.data.map(this.transformToResponse);

      return {
        data: transformedData,
        pagination: result.pagination,
      };
    } catch (error) {
      logger.error('Failed to get transactions', { error, query });
      throw error;
    }
  }

  /**
   * Get a single transaction by signature with extended details
   */
  async getTransactionBySignature(sig: string): Promise<TransactionResponse> {
    try {
      logger.debug('Getting transaction by signature', { sig });

      const transaction = await transactionRepository.findBySignature(sig);

      if (!transaction) {
        throw new NotFoundError('Transaction');
      }

      // Transform to response format with extended details
      const response = this.transformToResponse(transaction);

      // Add extended details (path and risk history)
      response.path = this.generateTransactionPath(transaction);
      response.riskHistory = this.generateRiskHistory(transaction);

      return response;
    } catch (error) {
      logger.error('Failed to get transaction by signature', { error, sig });
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats() {
    try {
      logger.debug('Getting transaction statistics');

      const stats = await transactionRepository.getStats();

      return {
        total: stats.total,
        highRisk: stats.highRisk,
        totalVolume: stats.totalVolume,
        avgRisk: stats.avgRisk,
        riskDistribution: {
          low: stats.total - stats.highRisk, // Simplified for now
          medium: 0,
          high: stats.highRisk,
          critical: 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get transaction statistics', { error });
      throw error;
    }
  }

  /**
   * Create a new transaction (used by ingestion service)
   */
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      logger.debug('Creating transaction', { sig: data.sig });

      // Apply risk scoring and labeling
      const enrichedData = this.enrichTransactionData(data);

      const transaction = await transactionRepository.create(enrichedData);

      logger.info('Transaction created', { sig: transaction.sig, risk: transaction.risk });

      return transaction;
    } catch (error) {
      logger.error('Failed to create transaction', { error, sig: data.sig });
      throw error;
    }
  }

  /**
   * Upsert transaction (create or update)
   */
  async upsertTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      logger.debug('Upserting transaction', { sig: data.sig });

      // Apply risk scoring and labeling
      const enrichedData = this.enrichTransactionData(data);

      const transaction = await transactionRepository.upsert(enrichedData);

      logger.debug('Transaction upserted', { sig: transaction.sig, risk: transaction.risk });

      return transaction;
    } catch (error) {
      logger.error('Failed to upsert transaction', { error, sig: data.sig });
      throw error;
    }
  }

  /**
   * Transform transaction to API response format
   */
  private transformToResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      sig: transaction.sig,
      tsISO: transaction.tsISO.toISOString(),
      from: transaction.from,
      to: transaction.to,
      amountUSDT: transaction.amountUSDT,
      risk: transaction.risk,
      labels: transaction.labels,
      hints: transaction.hints,
    };
  }

  /**
   * Generate transaction path for visualization
   */
  private generateTransactionPath(transaction: Transaction): TransactionPath[] {
    // This is a simplified implementation
    // In a real system, you would analyze the transaction chain
    const path: TransactionPath[] = [
      {
        address: transaction.from,
        type: this.inferAddressType(transaction.from, transaction.labels),
        label: 'Origin',
      },
    ];

    // Add intermediate hops if it's a complex transaction
    if (transaction.labels.includes('mixer') || transaction.labels.includes('bridge-hop')) {
      path.push({
        address: 'intermediate...',
        type: transaction.labels.includes('mixer') ? 'mixer' : 'contract',
        label: transaction.labels.includes('mixer') ? 'Mixer' : 'Bridge',
      });
    }

    path.push({
      address: transaction.to,
      type: this.inferAddressType(transaction.to, transaction.labels),
      label: 'Destination',
    });

    return path;
  }

  /**
   * Generate risk history for visualization
   */
  private generateRiskHistory(transaction: Transaction): RiskPoint[] {
    // This is a simplified implementation
    // In a real system, you would track risk changes over time
    const baseTime = new Date(transaction.tsISO.getTime() - 120000); // 2 minutes before

    return [
      {
        hop: 0,
        risk: Math.max(10, transaction.risk - 30),
        timestamp: baseTime.toISOString(),
      },
      {
        hop: 1,
        risk: Math.max(20, transaction.risk - 15),
        timestamp: new Date(baseTime.getTime() + 60000).toISOString(),
      },
      {
        hop: 2,
        risk: transaction.risk,
        timestamp: transaction.tsISO.toISOString(),
      },
    ];
  }

  /**
   * Infer address type from labels and patterns
   */
  private inferAddressType(address: string, labels: string[]): 'wallet' | 'contract' | 'cex' | 'mixer' {
    if (labels.includes('cex') || labels.includes('binance-hot')) return 'cex';
    if (labels.includes('mixer') || labels.includes('tornado-cash')) return 'mixer';
    if (labels.includes('bridge-hop') || labels.includes('ethereum-bridge')) return 'contract';
    return 'wallet';
  }

  /**
   * Enrich transaction data with risk scoring and labels
   */
  private enrichTransactionData(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): typeof data {
    // Apply risk scoring if not already set
    if (data.risk === 0) {
      data.risk = this.calculateRiskScore(data);
    }

    // Apply labels if not already set
    if (data.labels.length === 0) {
      data.labels = this.generateLabels(data);
    }

    // Apply hints if not already set
    if (data.hints.length === 0) {
      data.hints = this.generateHints(data);
    }

    // Apply risk factors if not already set
    if (data.riskFactors.length === 0) {
      data.riskFactors = this.generateRiskFactors(data);
    }

    return data;
  }

  /**
   * Calculate risk score based on transaction characteristics
   */
  private calculateRiskScore(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): number {
    let risk = 0;

    // Amount-based risk
    if (transaction.amountUSDT > 100000) risk += 30;
    else if (transaction.amountUSDT > 10000) risk += 15;
    else if (transaction.amountUSDT > 1000) risk += 5;

    // Time-based risk (simplified - would need more context in real implementation)
    const hour = transaction.tsISO.getHours();
    if (hour < 6 || hour > 22) risk += 10; // Off-hours

    // Address pattern risk (simplified)
    if (transaction.from === transaction.to) risk += 50; // Self-transfer
    if (transaction.from.length < 40 || transaction.to.length < 40) risk += 20; // Unusual address length

    return Math.min(100, Math.max(0, risk));
  }

  /**
   * Generate labels based on transaction characteristics
   */
  private generateLabels(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): string[] {
    const labels: string[] = [];

    // Amount-based labels
    if (transaction.amountUSDT > 100000) labels.push('large-amount');
    if (transaction.amountUSDT < 1) labels.push('dust');

    // Pattern-based labels (simplified)
    if (transaction.from === transaction.to) labels.push('self-transfer');

    // Default label for normal transactions
    if (labels.length === 0) labels.push('normal');

    return labels;
  }

  /**
   * Generate hints for analysts
   */
  private generateHints(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): string[] {
    const hints: string[] = [];

    if (transaction.amountUSDT > 100000) {
      hints.push('Large amount - requires additional scrutiny');
    }

    if (transaction.risk > 70) {
      hints.push('High risk transaction - investigate thoroughly');
    }

    const hour = transaction.tsISO.getHours();
    if (hour < 6 || hour > 22) {
      hints.push('Off-hours transaction');
    }

    return hints;
  }

  /**
   * Generate risk factors
   */
  private generateRiskFactors(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): string[] {
    const factors: string[] = [];

    if (transaction.amountUSDT > 100000) factors.push('large_amount');
    if (transaction.risk > 70) factors.push('high_risk_score');
    if (transaction.from === transaction.to) factors.push('self_transfer');

    const hour = transaction.tsISO.getHours();
    if (hour < 6 || hour > 22) factors.push('off_hours');

    return factors;
  }
}

// Export singleton instance
export const transactionService = new TransactionService();




