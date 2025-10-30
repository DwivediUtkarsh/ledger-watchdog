// API service for Ledger Watchdog - Real backend integration
import { Tx, FlagInput } from "@/types";

import { config } from './config';

const API_BASE_URL = config.apiBaseUrl;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

interface TransactionListResponse {
  data: Tx[];
  pagination: {
    hasNext: boolean;
  };
}

interface FlagSubmissionResponse {
  flag: {
    id: string;
    txSig: string;
    category: string;
    severity: string;
    confidence: number;
    notes: string;
    evidenceUrls: string[];
    status: string;
    createdAt: string;
  };
  points: number;
}

// Helper function to handle API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error('API request failed');
  }
  
  return result.data;
}

// Transform backend transaction format to frontend format
function transformTransaction(backendTx: any): Tx {
  return {
    sig: backendTx.sig,
    tsISO: backendTx.tsISO,
    from: backendTx.from,
    to: backendTx.to,
    amountUSDT: backendTx.amountUSDT,
    risk: backendTx.risk || 0,
    labels: backendTx.labels || [],
    hints: backendTx.hints || [],
    // Add path and riskHistory if available
    path: backendTx.path,
    riskHistory: backendTx.riskHistory,
  };
}

// API functions to replace mock data
export const fetchTransactions = async (filters?: { 
  query?: string; 
  minAmount?: number; 
  minRisk?: number;
  limit?: number;
  lookback?: number;
}): Promise<Tx[]> => {
  const params = new URLSearchParams();
  
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.lookback) params.append('lookback', filters.lookback.toString());
  
  // Note: Backend currently doesn't support query/minAmount/minRisk filters for live feed
  // We'll filter client-side for now, or extend backend later
  
  const endpoint = `/transactions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiRequest<TransactionListResponse>(endpoint);
  
  let transactions = response.data.map(transformTransaction);
  
  // Client-side filtering for now (can be moved to backend later)
  if (filters?.query) {
    const query = filters.query.toLowerCase();
    transactions = transactions.filter(tx => 
      tx.sig.toLowerCase().includes(query) ||
      tx.from.toLowerCase().includes(query) ||
      tx.to.toLowerCase().includes(query) ||
      tx.labels.some(label => label.toLowerCase().includes(query))
    );
  }
  
  if (filters?.minAmount) {
    transactions = transactions.filter(tx => tx.amountUSDT >= filters.minAmount!);
  }
  
  if (filters?.minRisk) {
    transactions = transactions.filter(tx => tx.risk >= filters.minRisk!);
  }
  
  return transactions;
};

export const fetchTransactionDetails = async (sig: string): Promise<Tx | null> => {
  try {
    const response = await apiRequest<any>(`/transactions/${sig}`);
    return transformTransaction(response);
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
};

export const submitFlag = async (flag: FlagInput): Promise<{ success: boolean; points: number }> => {
  try {
    const response = await apiRequest<FlagSubmissionResponse>('/flags', {
      method: 'POST',
      body: JSON.stringify(flag),
    });
    
    return { 
      success: true, 
      points: response.points 
    };
  } catch (error) {
    console.error('Flag submission failed:', error);
    return { 
      success: false, 
      points: 0 
    };
  }
};

// Additional API functions for future use
export const fetchTransactionStats = async () => {
  return apiRequest<any>('/transactions/stats');
};

export const fetchFlagStats = async () => {
  return apiRequest<any>('/flags/stats');
};
