// Mock data for Ledger Watchdog - USDT transactions on Solana

import { Tx, User, LeaderboardEntry, FlagReport, FlagInput, calculatePoints } from "@/types";

export const mockTransactions: Tx[] = [
  {
    sig: "4S5RkJm2bXnFZQvEwKx9T8hPqR7mNcVe3aL6uDgFr2wWz1qYxE5zMn8vB9pA7sKjHgTrNm4xCd2eUi6oWsLvXe9u",
    tsISO: "2024-01-15T14:23:45.000Z",
    from: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    to: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amountUSDT: 250000.50,
    risk: 95,
    labels: ["mixer", "tornado-cash", "high-risk"],
    hints: ["Large amount", "Known mixer address", "Rapid succession"]
  },
  {
    sig: "2mK7qF8dN3bS5wRtYuVx6zCaE4pM9jLhGf1rBcXe8nWvQs7oP5uTm2iD3kLx9zNa4bVc6fGhJwRt8yQm5pKs1nMx",
    tsISO: "2024-01-15T14:21:32.000Z", 
    from: "5vK3mJ8qR2nF7wBtYxCz9dLaP6sM4hGf2rBcXe1nWvQs",
    to: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    amountUSDT: 1500.75,
    risk: 15,
    labels: ["cex", "binance-hot"],
    hints: ["CEX withdrawal", "Normal pattern"]
  },
  {
    sig: "8nP2qW9rT5xF6bM4aZ7cE3vL8jK5gH2dN6mB9sQ1wR4tY7uI3oP5kLx8zNa2bVc6fGhJwRt9yQm3pKs7nMx4eUd",
    tsISO: "2024-01-15T14:19:18.000Z",
    from: "7dP3qM8rF5xB6wT4aZ9cE2vL7jK4gH3dN5mB8sQ2wR1t",
    to: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amountUSDT: 85000.00,
    risk: 78,
    labels: ["bridge-hop", "ethereum-bridge"],
    hints: ["Cross-chain", "Bridge contract"]
  },
  {
    sig: "6mL9qN3rF8xB5wT2aZ4cE7vP1jK9gH6dN3mB2sQ8wR5tY4uI7oP2kLx1zNa9bVc3fGhJwRt6yQm8pKs4nMx7eUd",
    tsISO: "2024-01-15T14:17:05.000Z",
    from: "3qM6rN9xF2bT5wZ8cE4vL7jK1gH9dP6mB3sQ5wR2tY8u",
    to: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    amountUSDT: 12.50,
    risk: 8,
    labels: ["dex-swap", "jupiter"],
    hints: ["DEX trade", "Small amount"]
  },
  {
    sig: "1nK4qL7rM9xF3bT6wZ2cE8vP5jK3gH1dN9mB6sQ4wR8tY2uI5oP7kLx4zNa6bVc9fGhJwRt3yQm1pKs8nMx2eUd",
    tsISO: "2024-01-15T14:15:42.000Z",
    from: "8pQ3mK6rL9xF2bT5wZ1cE7vP4jK8gH3dN2mB9sQ7wR4t",
    to: "5vK3mJ8qR2nF7wBtYxCz9dLaP6sM4hGf2rBcXe1nWvQs",
    amountUSDT: 500000.00,
    risk: 92,
    labels: ["scam", "fake-airdrop", "drainer"],
    hints: ["Victim approved drainer", "Large drain", "Known scam pattern"]
  },
  {
    sig: "9oR6qP3mN8xF4bT7wZ5cE1vL2jK6gH9dP3mB1sQ9wR6tY5uI8oP4kLx7zNa3bVc1fGhJwRt9yQm6pKs2nMx5eUd",
    tsISO: "2024-01-15T14:13:28.000Z",
    from: "2mK7qF8dN3bS5wRtYuVx6zCaE4pM9jLhGf1r",
    to: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 
    amountUSDT: 25000.00,
    risk: 65,
    labels: ["mixer", "bridge-hop"],
    hints: ["Multi-hop", "Obfuscation attempt"]
  },
  {
    sig: "4sT8qR2mP9xF6bN7wZ3cE5vL8jK2gH4dP9mB8sQ2wR9tY3uI6oP8kLx2zNa5bVc8fGhJwRt2yQm9pKs6nMx3eUd",
    tsISO: "2024-01-15T14:11:15.000Z",
    from: "7dP3qM8rF5xB6wT4aZ9cE2vL7jK4gH3dN5mB8sQ2wR1t",
    to: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    amountUSDT: 750.25,
    risk: 22,
    labels: ["dex-swap", "raydium"],
    hints: ["AMM trade", "Normal volume"]
  },
  {
    sig: "7uV1qS5mR3xF9bN2wZ6cE4vL1jK5gH7dP2mB4sQ6wR3tY9uI2oP1kLx5zNa8bVc2fGhJwRt5yQm3pKs9nMx6eUd",
    tsISO: "2024-01-15T14:09:03.000Z",
    from: "3qM6rN9xF2bT5wZ8cE4vL7jK1gH9dP6mB3sQ5wR2tY8u",
    to: "5vK3mJ8qR2nF7wBtYxCz9dLaP6sM4hGf2rBcXe1nWvQs",
    amountUSDT: 100000.00,
    risk: 88,
    labels: ["phishing", "fake-site", "approval-drain"],
    hints: ["Phishing victim", "Token approval exploit", "Coordinated attack"]
  }
];

export const mockUser: User = {
  handle: "kira",
  isVerified: true,
  level: 12,
  points: 2847,
  streak: 7,
  trust: 89,
  tier: "Gold"
};

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    handle: "crypto_sleuth",
    points: 4521,
    level: 18,
    trust: 96,
    tier: "Platinum",
    streak: 15,
    isVerified: true
  },
  {
    rank: 2,
    handle: "chain_analyst",
    points: 3892,
    level: 15,
    trust: 94,
    tier: "Gold",
    streak: 12,
    isVerified: true
  },
  {
    rank: 3,
    handle: "kira",
    points: 2847,
    level: 12,
    trust: 89,
    tier: "Gold",
    streak: 7,
    isVerified: true
  },
  {
    rank: 4,
    handle: "tx_hunter",
    points: 2156,
    level: 9,
    trust: 87,
    tier: "Silver",
    streak: 4,
    isVerified: true
  },
  {
    rank: 5,
    handle: "scam_spotter",
    points: 1834,
    level: 8,
    trust: 82,
    tier: "Silver", 
    streak: 2,
    isVerified: false
  }
];

export const mockReports: FlagReport[] = [
  {
    id: "r1",
    txSig: "4S5RkJm2bXnFZQvEwKx9T8hPqR7mNcVe3aL6uDgFr2wWz1qYxE5zMn8vB9pA7sKjHgTrNm4xCd2eUi6oWsLvXe9u",
    category: "Mixer / Tumbler",
    severity: "high",
    confidence: 92,
    notes: "Large amount moved through known Tornado Cash mixer with rapid succession pattern.",
    evidenceUrls: ["https://solscan.io/tx/..."],
    status: "accepted",
    createdAt: "2024-01-15T14:30:00.000Z",
    points: 41
  },
  {
    id: "r2", 
    txSig: "8nP2qW9rT5xF6bM4aZ7cE3vL8jK5gH2dN6mB9sQ1wR4tY7uI3oP5kLx8zNa2bVc6fGhJwRt9yQm3pKs7nMx4eUd",
    category: "Bridge / Cross-chain",
    severity: "medium",
    confidence: 75,
    notes: "Suspicious bridge activity with timing patterns suggesting coordination.",
    evidenceUrls: [],
    status: "pending",
    createdAt: "2024-01-15T14:25:00.000Z"
  }
];

// Mock API functions
export const fetchTransactions = async (filters?: { query?: string; minAmount?: number; minRisk?: number }): Promise<Tx[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filtered = [...mockTransactions];
  
  if (filters?.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(tx => 
      tx.sig.toLowerCase().includes(query) ||
      tx.from.toLowerCase().includes(query) ||
      tx.to.toLowerCase().includes(query) ||
      tx.labels.some(label => label.toLowerCase().includes(query))
    );
  }
  
  if (filters?.minAmount) {
    filtered = filtered.filter(tx => tx.amountUSDT >= filters.minAmount!);
  }
  
  if (filters?.minRisk) {
    filtered = filtered.filter(tx => tx.risk >= filters.minRisk!);
  }
  
  return filtered;
};

export const fetchTransactionDetails = async (sig: string): Promise<Tx | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const tx = mockTransactions.find(t => t.sig === sig);
  if (!tx) return null;
  
  // Add extended details
  return {
    ...tx,
    path: [
      { address: tx.from, type: 'wallet', label: 'Origin' },
      { address: 'intermediary...', type: 'mixer', label: 'Tornado Cash' },
      { address: tx.to, type: 'wallet', label: 'Destination' }
    ],
    riskHistory: [
      { hop: 0, risk: 10, timestamp: '2024-01-15T14:20:00.000Z' },
      { hop: 1, risk: 65, timestamp: '2024-01-15T14:21:00.000Z' },
      { hop: 2, risk: tx.risk, timestamp: tx.tsISO }
    ]
  };
};

export const submitFlag = async (flag: FlagInput): Promise<{ success: boolean; points: number }> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const points = calculatePoints(flag.severity, flag.confidence, mockUser.isVerified);
  
  return { success: true, points };
};