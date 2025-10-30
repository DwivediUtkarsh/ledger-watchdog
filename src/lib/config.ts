// Configuration for the frontend application
export const config = {
  // API Configuration
  apiBaseUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api/v1'
    : '/api/v1',
  
  // Live feed configuration
  liveFeed: {
    refreshInterval: 1800000, // 30 minutes (1800000 milliseconds)
    defaultLimit: 50,
    defaultLookback: 86400, // 24 hours (86400 seconds)
  },
  
  // UI Configuration
  ui: {
    transactionTablePageSize: 20,
    maxEvidenceUrls: 5,
    minFlagNotes: 20,
  },
} as const;

export type Config = typeof config;
