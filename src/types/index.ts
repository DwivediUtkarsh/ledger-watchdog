// Ledger Watchdog Types - Transaction monitoring and flagging system

export type Tx = {
  sig: string;
  tsISO: string;
  from: string;
  to: string;
  amountUSDT: number;
  risk: number;
  labels: string[];
  hints: string[];
  // Extended fields for details
  path?: TxPath[];
  riskHistory?: RiskPoint[];
};

export type TxPath = {
  address: string;
  type: 'wallet' | 'contract' | 'cex' | 'mixer';
  label?: string;
};

export type RiskPoint = {
  hop: number;
  risk: number;
  timestamp: string;
};

export type User = {
  handle: string;
  isVerified: boolean;
  level: number;
  points: number;
  streak: number;
  trust: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
};

export type FlagInput = {
  txSig: string;
  category: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  notes: string;
  evidenceUrls: string[];
};

export type FlagReport = {
  id: string;
  txSig: string;
  category: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  notes: string;
  evidenceUrls: string[];
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  points?: number;
};

export type LeaderboardEntry = {
  rank: number;
  handle: string;
  points: number;
  level: number;
  trust: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  streak: number;
  isVerified: boolean;
};

export type FilterState = {
  query: string;
  minAmount: number;
  minRisk: number;
};

// Risk level helpers
export const getRiskLevel = (risk: number): "low" | "medium" | "high" | "critical" => {
  if (risk >= 90) return "critical";
  if (risk >= 70) return "high";
  if (risk >= 40) return "medium";
  return "low";
};

export const getRiskColor = (risk: number): string => {
  const level = getRiskLevel(risk);
  const colors = {
    low: "risk-low",
    medium: "risk-medium", 
    high: "risk-high",
    critical: "risk-critical"
  };
  return colors[level];
};

// Points calculation
export const calculatePoints = (severity: "low" | "medium" | "high", confidence: number, isVerified: boolean): number => {
  const basePoints = {
    low: 12,
    medium: 25,
    high: 40
  };
  
  const multiplier = (confidence / 100) * 1.2 + 0.4;
  let points = basePoints[severity] * multiplier;
  
  if (!isVerified) {
    points *= 0.3;
  }
  
  return Math.round(points);
};