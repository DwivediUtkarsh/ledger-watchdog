/**
 * Database seeding script
 * Populates the database with sample USDT transaction data for development
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { config } from '@/config';

// Sample transaction data based on the frontend mock data
const sampleTransactions = [
  {
    sig: '4S5RkJm2bXnFZQvEwKx9T8hPqR7mNcVe3aL6uDgFr2wWz1qYxE5zMn8vB9pA7sKjHgTrNm4xCd2eUi6oWsLvXe9u',
    tsISO: new Date('2024-01-15T14:23:45.000Z'),
    from: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    to: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountUSDT: 250000.50,
    risk: 95,
    labels: JSON.stringify(['mixer', 'tornado-cash', 'high-risk']),
    hints: JSON.stringify(['Large amount', 'Known mixer address', 'Rapid succession']),
    riskFactors: JSON.stringify(['large_amount', 'known_mixer', 'rapid_succession']),
    slot: BigInt(123456789),
    status: 'confirmed',
  },
  {
    sig: '2mK7qF8dN3bS5wRtYuVx6zCaE4pM9jLhGf1rBcXe8nWvQs7oP5uTm2iD3kLx9zNa4bVc6fGhJwRt8yQm5pKs1nMx',
    tsISO: new Date('2024-01-15T14:21:32.000Z'),
    from: '5vK3mJ8qR2nF7wBtYxCz9dLaP6sM4hGf2rBcXe1nWvQs',
    to: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amountUSDT: 1500.75,
    risk: 15,
    labels: JSON.stringify(['cex', 'binance-hot']),
    hints: JSON.stringify(['CEX withdrawal', 'Normal pattern']),
    riskFactors: JSON.stringify(['cex_withdrawal']),
    slot: BigInt(123456788),
    status: 'confirmed',
  },
  {
    sig: '8nP2qW9rT5xF6bM4aZ7cE3vL8jK5gH2dN6mB9sQ1wR4tY7uI3oP5kLx8zNa2bVc6fGhJwRt9yQm3pKs7nMx4eUd',
    tsISO: new Date('2024-01-15T14:19:18.000Z'),
    from: '7dP3qM8rF5xB6wT4aZ9cE2vL7jK4gH3dN5mB8sQ2wR1t',
    to: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountUSDT: 85000.00,
    risk: 78,
    labels: JSON.stringify(['bridge-hop', 'ethereum-bridge']),
    hints: JSON.stringify(['Cross-chain', 'Bridge contract']),
    riskFactors: JSON.stringify(['cross_chain', 'bridge_contract']),
    slot: BigInt(123456787),
    status: 'confirmed',
  },
  {
    sig: '6mL9qN3rF8xB5wT2aZ4cE7vP1jK9gH6dN3mB2sQ8wR5tY4uI7oP2kLx1zNa9bVc3fGhJwRt6yQm8pKs4nMx7eUd',
    tsISO: new Date('2024-01-15T14:17:05.000Z'),
    from: '3qM6rN9xF2bT5wZ8cE4vL7jK1gH9dP6mB3sQ5wR2tY8u',
    to: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amountUSDT: 12.50,
    risk: 8,
    labels: JSON.stringify(['dex-swap', 'jupiter']),
    hints: JSON.stringify(['DEX trade', 'Small amount']),
    riskFactors: JSON.stringify(['dex_trade']),
    slot: BigInt(123456786),
    status: 'confirmed',
  },
  {
    sig: '1nK4qL7rM9xF3bT6wZ2cE8vP5jK3gH1dN9mB6sQ4wR8tY2uI5oP7kLx4zNa6bVc9fGhJwRt3yQm1pKs8nMx2eUd',
    tsISO: new Date('2024-01-15T14:15:42.000Z'),
    from: '8pQ3mK6rL9xF2bT5wZ1cE7vP4jK8gH3dN2mB9sQ7wR4t',
    to: '5vK3mJ8qR2nF7wBtYxCz9dLaP6sM4hGf2rBcXe1nWvQs',
    amountUSDT: 500000.00,
    risk: 92,
    labels: JSON.stringify(['scam', 'fake-airdrop', 'drainer']),
    hints: JSON.stringify(['Victim approved drainer', 'Large drain', 'Known scam pattern']),
    riskFactors: JSON.stringify(['victim_approved_drainer', 'large_drain', 'known_scam']),
    slot: BigInt(123456785),
    status: 'confirmed',
  },
  {
    sig: '9oR6qP3mN8xF4bT7wZ5cE1vL2jK6gH9dP3mB1sQ9wR6tY5uI8oP4kLx7zNa3bVc1fGhJwRt9yQm6pKs2nMx5eUd',
    tsISO: new Date('2024-01-15T14:13:28.000Z'),
    from: '2mK7qF8dN3bS5wRtYuVx6zCaE4pM9jLhGf1r',
    to: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountUSDT: 25000.00,
    risk: 65,
    labels: JSON.stringify(['mixer', 'bridge-hop']),
    hints: JSON.stringify(['Multi-hop', 'Obfuscation attempt']),
    riskFactors: JSON.stringify(['multi_hop', 'obfuscation']),
    slot: BigInt(123456784),
    status: 'confirmed',
  },
  {
    sig: '4sT8qR2mP9xF6bN7wZ3cE5vL8jK2gH4dP9mB8sQ2wR9tY3uI6oP8kLx2zNa5bVc8fGhJwRt2yQm9pKs6nMx3eUd',
    tsISO: new Date('2024-01-15T14:11:15.000Z'),
    from: '7dP3qM8rF5xB6wT4aZ9cE2vL7jK4gH3dN5mB8sQ2wR1t',
    to: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amountUSDT: 750.25,
    risk: 22,
    labels: JSON.stringify(['dex-swap', 'raydium']),
    hints: JSON.stringify(['AMM trade', 'Normal volume']),
    riskFactors: JSON.stringify(['amm_trade']),
    slot: BigInt(123456783),
    status: 'confirmed',
  },
  {
    sig: '7uV1qS5mR3xF9bN2wZ6cE4vL1jK5gH7dP2mB4sQ6wR3tY9uI2oP1kLx5zNa8bVc2fGhJwRt5yQm3pKs9nMx6eUd',
    tsISO: new Date('2024-01-15T14:09:03.000Z'),
    from: '3qM6rN9xF2bT5wZ8cE4vL7jK1gH9dP6mB3sQ5wR2tY8u',
    to: '5vK3mJ8qR2nF7wBtYxCz9dLaP6sM4hGf2rBcXe1nWvQs',
    amountUSDT: 100000.00,
    risk: 88,
    labels: JSON.stringify(['phishing', 'fake-site', 'approval-drain']),
    hints: JSON.stringify(['Phishing victim', 'Token approval exploit', 'Coordinated attack']),
    riskFactors: JSON.stringify(['phishing_victim', 'token_approval_exploit', 'coordinated_attack']),
    slot: BigInt(123456782),
    status: 'confirmed',
  },
];

// Sample flag data
const sampleFlags = [
  {
    txSig: '4S5RkJm2bXnFZQvEwKx9T8hPqR7mNcVe3aL6uDgFr2wWz1qYxE5zMn8vB9pA7sKjHgTrNm4xCd2eUi6oWsLvXe9u',
    category: 'Mixer / Tumbler',
    severity: 'high',
    confidence: 92,
    notes: 'Large amount moved through known Tornado Cash mixer with rapid succession pattern. This transaction shows clear signs of money laundering activity.',
    evidenceUrls: JSON.stringify(['https://solscan.io/tx/4S5RkJm2bXnFZQvEwKx9T8hPqR7mNcVe3aL6uDgFr2wWz1qYxE5zMn8vB9pA7sKjHgTrNm4xCd2eUi6oWsLvXe9u']),
    status: 'accepted',
    reporterHandle: 'crypto_analyst',
    reporterVerified: true,
    pointsAwarded: 41,
    reviewedAt: new Date('2024-01-15T14:30:00.000Z'),
    reviewedBy: 'admin',
    reviewNotes: 'Confirmed suspicious activity. Good analysis.',
  },
  {
    txSig: '8nP2qW9rT5xF6bM4aZ7cE3vL8jK5gH2dN6mB9sQ1wR4tY7uI3oP5kLx8zNa2bVc6fGhJwRt9yQm3pKs7nMx4eUd',
    category: 'Bridge / Cross-chain',
    severity: 'medium',
    confidence: 75,
    notes: 'Suspicious bridge activity with timing patterns suggesting coordination. Multiple large transfers within short time window.',
    evidenceUrls: JSON.stringify([]),
    status: 'pending',
    reporterHandle: 'bridge_watcher',
    reporterVerified: true,
  },
];

// Ingestion cursor data
const sampleCursors = [
  {
    source: 'helius_webhook',
    lastSlot: BigInt(123456789),
    lastSig: '4S5RkJm2bXnFZQvEwKx9T8hPqR7mNcVe3aL6uDgFr2wWz1qYxE5zMn8vB9pA7sKjHgTrNm4xCd2eUi6oWsLvXe9u',
    isActive: true,
    metadata: JSON.stringify({ webhookId: 'wh_123', lastProcessedAt: '2024-01-15T14:23:45.000Z' }),
  },
  {
    source: 'rpc_polling',
    lastSlot: BigInt(123456700),
    isActive: false,
    metadata: JSON.stringify({ intervalMs: 30000, lastError: null }),
  },
];

// Main seeding function
const seed = async (): Promise<void> => {
  try {
    logger.info('Starting database seeding...');

    // Clear existing data in development
    if (config.nodeEnv === 'development') {
      logger.info('Clearing existing data...');
      await prisma.flag.deleteMany();
      await prisma.transaction.deleteMany();
      await prisma.ingestionCursor.deleteMany();
      await prisma.systemMetric.deleteMany();
    }

    // Seed transactions
    logger.info('Seeding transactions...');
    for (const transaction of sampleTransactions) {
      await prisma.transaction.create({
        data: transaction,
      });
    }
    logger.info(`✅ Created ${sampleTransactions.length} transactions`);

    // Seed flags
    logger.info('Seeding flags...');
    for (const flag of sampleFlags) {
      await prisma.flag.create({
        data: flag,
      });
    }
    logger.info(`✅ Created ${sampleFlags.length} flags`);

    // Seed ingestion cursors
    logger.info('Seeding ingestion cursors...');
    for (const cursor of sampleCursors) {
      await prisma.ingestionCursor.create({
        data: cursor,
      });
    }
    logger.info(`✅ Created ${sampleCursors.length} ingestion cursors`);

    // Add some system metrics
    logger.info('Seeding system metrics...');
    await prisma.systemMetric.createMany({
      data: [
        {
          metric: 'transactions_ingested',
          value: sampleTransactions.length,
          tags: JSON.stringify({ source: 'seed_script' }),
        },
        {
          metric: 'flags_submitted',
          value: sampleFlags.length,
          tags: JSON.stringify({ source: 'seed_script' }),
        },
        {
          metric: 'api_requests_total',
          value: 0,
          tags: JSON.stringify({ endpoint: 'all' }),
        },
      ],
    });
    logger.info('✅ Created system metrics');

    logger.info('🎉 Database seeding completed successfully!');

    // Log summary
    const counts = {
      transactions: await prisma.transaction.count(),
      flags: await prisma.flag.count(),
      cursors: await prisma.ingestionCursor.count(),
      metrics: await prisma.systemMetric.count(),
    };

    logger.info('Database summary:', counts);

  } catch (error) {
    logger.error('Seeding failed:', { error });
    throw error;
  }
};

// Run seeding if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seed()
    .then(() => {
      logger.info('Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding script failed:', { error });
      process.exit(1);
    });
}

export { seed };
