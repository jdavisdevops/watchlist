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
  flags: string[];
  lastUpdated: string;
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

