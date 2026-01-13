export interface InsiderTransactionData {
  netBuying: number;
  transactionCount: number;
  executiveBuying: number; // Weighted buying by executives
  clusterDetected: boolean;
}

export type DataQuality = 'complete' | 'partial' | 'minimal' | 'unavailable';

export interface TickerData {
  ticker: string;
  float: number | null;
  shortFloatShares: number | null;
  pctFloatShort: number | null;
  institutionalOwnership: number | null;
  lastReverseSplitDate: string | null;
  reverseSplitRatio: string | null;
  sector: string | null;
  companyDescription: string | null;
  marketCap: number | null;
  totalCash: number | null;
  freeCashFlowTTM: number | null;
  cashRunwayMonths: number | null;
  sharesOutstanding: number | null;
  dilutionYoY: number | null;
  insiderBuyNet90d: number | null; // Keep for backward compatibility
  insiderTransactionData: InsiderTransactionData | null; // New detailed data
  flags: string[];
  dataQuality: DataQuality;
  dataQualityMessage?: string; // Optional explanation
  lastUpdated: string;
  
  // Price & Trading Data
  regularMarketPrice: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  averageVolume: number | null;
  
  // Analyst Data
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  targetMeanPrice: number | null;
  recommendationMean: number | null;
  numberOfAnalystOpinions: number | null;
  
  // Earnings Estimates
  earningsAverage: number | null;
  earningsLow: number | null;
  earningsHigh: number | null;
  revenueAverage: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  
  // Additional Context
  currency: string | null;
  exchange: string | null;
}

export interface TickerApiResponse {
  success: boolean;
  data?: TickerData;
  error?: string;
}

export interface WatchlistStorage {
  tickers: string[];
  lastSync?: string;
}

