import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { TickerData } from "@/lib/tickerData";

const yahooFinance = new YahooFinance();

// Helper functions
function safeGet(d: Record<string, any>, key: string): any {
  const v = d[key];
  if (v === null || v === undefined) {
    return null;
  }
  // Check for NaN
  if (typeof v === "number" && isNaN(v)) {
    return null;
  }
  return v;
}

function asInt(x: any): number | null {
  if (x === null || x === undefined) {
    return null;
  }
  try {
    const num = Number(x);
    if (isNaN(num)) {
      return null;
    }
    return Math.floor(num);
  } catch {
    return null;
  }
}

function asFloat(x: any): number | null {
  if (x === null || x === undefined) {
    return null;
  }
  try {
    const num = Number(x);
    if (isNaN(num)) {
      return null;
    }
    return num;
  } catch {
    return null;
  }
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Extract data from quote() method
function extractFromQuote(quote: any): Partial<{
  marketCap: number | null;
  sharesOutstanding: number | null;
  companyDescription: string | null;
  regularMarketPrice: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  currency: string | null;
  exchange: string | null;
}> {
  return {
    marketCap: asInt(safeGet(quote, 'marketCap')),
    sharesOutstanding: asInt(safeGet(quote, 'sharesOutstanding')),
    companyDescription: safeGet(quote, 'longName') || null,
    regularMarketPrice: asFloat(safeGet(quote, 'regularMarketPrice')),
    previousClose: asFloat(safeGet(quote, 'regularMarketPreviousClose')),
    dayHigh: asFloat(safeGet(quote, 'regularMarketDayHigh')),
    dayLow: asFloat(safeGet(quote, 'regularMarketDayLow')),
    fiftyTwoWeekHigh: asFloat(safeGet(quote, 'fiftyTwoWeekHigh')),
    fiftyTwoWeekLow: asFloat(safeGet(quote, 'fiftyTwoWeekLow')),
    volume: asInt(safeGet(quote, 'regularMarketVolume')),
    currency: safeGet(quote, 'currency') || null,
    exchange: safeGet(quote, 'exchange') || null,
  };
}

// Extract data from quoteSummary price/summaryDetail/quoteType modules
function extractFromPriceModules(data: any): Partial<{
  marketCap: number | null;
  companyDescription: string | null;
}> {
  const price = data.price || {};
  const summaryDetail = data.summaryDetail || {};
  const quoteType = data.quoteType || {};
  
  return {
    marketCap: asInt(safeGet(price, 'marketCap')) || asInt(safeGet(summaryDetail, 'marketCap')),
    companyDescription: safeGet(quoteType, 'longName') || safeGet(quoteType, 'shortName') || null,
  };
}

// Extract data from summaryDetail module
function extractFromSummaryDetail(data: any): Partial<{
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  averageVolume: number | null;
  volume: number | null;
}> {
  const summaryDetail = data.summaryDetail || {};
  
  return {
    fiftyTwoWeekHigh: asFloat(safeGet(summaryDetail, 'fiftyTwoWeekHigh')),
    fiftyTwoWeekLow: asFloat(safeGet(summaryDetail, 'fiftyTwoWeekLow')),
    averageVolume: asInt(safeGet(summaryDetail, 'averageVolume')),
    volume: asInt(safeGet(summaryDetail, 'volume')),
  };
}

// Extract data from fundamentals modules
function extractFromFundamentals(data: any): Partial<{
  float: number | null;
  shortFloatShares: number | null;
  pctFloatShort: number | null;
  institutionalOwnership: number | null;
  sector: string | null;
  companyDescription: string | null;
  marketCap: number | null;
  totalCash: number | null;
  freeCashFlowTTM: number | null;
  sharesOutstanding: number | null;
}> {
  const info = data.defaultKeyStatistics || {};
  const profile = data.summaryProfile || {};
  const financialData = data.financialData || {};
  
  const floatShares = asInt(safeGet(info, 'floatShares'));
  const sharesShort = asInt(safeGet(info, 'sharesShort'));
  const heldInst = asFloat(safeGet(info, 'heldPercentInstitutions'));
  const sector = safeGet(profile, 'sector') || safeGet(info, 'sector');
  
  let desc = safeGet(profile, 'longBusinessSummary');
  if (typeof desc === 'string') {
    desc = desc.trim().replace(/\n/g, ' ');
    const parts = desc.split('. ');
    desc =
      parts.length > 1
        ? parts[0].trim() + '.'
        : desc.slice(0, 220).trim() + (desc.length > 220 ? '…' : '');
  } else {
    desc = null;
  }
  
  const marketCap = asInt(safeGet(info, 'marketCap'));
  const totalCash = asInt(safeGet(financialData, 'totalCash'));
  const freeCashFlow = asInt(safeGet(financialData, 'freeCashflow'));
  const sharesOut = asInt(safeGet(info, 'sharesOutstanding'));
  
  const pctFloatShort = floatShares && sharesShort ? sharesShort / floatShares : null;
  
  return {
    float: floatShares,
    shortFloatShares: sharesShort,
    pctFloatShort,
    institutionalOwnership: heldInst,
    sector,
    companyDescription: desc,
    marketCap,
    totalCash,
    freeCashFlowTTM: freeCashFlow,
    sharesOutstanding: sharesOut,
  };
}

// Extract analyst data from financialData module
function extractFromFinancialData(data: any): Partial<{
  totalCash: number | null;
  freeCashFlowTTM: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  targetMeanPrice: number | null;
  recommendationMean: number | null;
  numberOfAnalystOpinions: number | null;
}> {
  const financialData = data.financialData || {};
  
  return {
    totalCash: asInt(safeGet(financialData, 'totalCash')),
    freeCashFlowTTM: asInt(safeGet(financialData, 'freeCashflow')),
    targetHighPrice: asFloat(safeGet(financialData, 'targetHighPrice')),
    targetLowPrice: asFloat(safeGet(financialData, 'targetLowPrice')),
    targetMeanPrice: asFloat(safeGet(financialData, 'targetMeanPrice')),
    recommendationMean: asFloat(safeGet(financialData, 'recommendationMean')),
    numberOfAnalystOpinions: asInt(safeGet(financialData, 'numberOfAnalystOpinions')),
  };
}

// Extract data from calendarEvents module (IPO dates, earnings dates, etc.)
function extractFromCalendarEvents(data: any): Partial<{
  ipoDate: string | null;
  earningsDate: string | null;
  exDividendDate: string | null;
  earningsAverage: number | null;
  earningsLow: number | null;
  earningsHigh: number | null;
  revenueAverage: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
}> {
  const calendarEvents = data.calendarEvents || {};
  
  // Extract IPO date - can be in various formats
  let ipoDate: string | null = null;
  const ipoDateRaw = safeGet(calendarEvents, 'ipoDate');
  if (ipoDateRaw) {
    try {
      if (typeof ipoDateRaw === 'number') {
        ipoDate = new Date(ipoDateRaw * 1000).toISOString().split('T')[0];
      } else if (typeof ipoDateRaw === 'string') {
        ipoDate = new Date(ipoDateRaw).toISOString().split('T')[0];
      } else if (ipoDateRaw.raw) {
        const raw = typeof ipoDateRaw.raw === 'number' ? ipoDateRaw.raw * 1000 : ipoDateRaw.raw;
        ipoDate = new Date(raw).toISOString().split('T')[0];
      }
    } catch {
      ipoDate = null;
    }
  }
  
  // Extract earnings date
  let earningsDate: string | null = null;
  const earningsData = calendarEvents.earnings || {};
  const earningsDateRaw = safeGet(earningsData, 'earningsDate');
  if (earningsDateRaw) {
    try {
      if (Array.isArray(earningsDateRaw) && earningsDateRaw.length > 0) {
        const firstDate = earningsDateRaw[0];
        const raw = safeGet(firstDate, 'raw') || firstDate;
        if (typeof raw === 'number') {
          earningsDate = new Date(raw * 1000).toISOString().split('T')[0];
        } else {
          earningsDate = new Date(raw).toISOString().split('T')[0];
        }
      } else if (typeof earningsDateRaw === 'number') {
        earningsDate = new Date(earningsDateRaw * 1000).toISOString().split('T')[0];
      } else if (typeof earningsDateRaw === 'string') {
        earningsDate = new Date(earningsDateRaw).toISOString().split('T')[0];
      }
    } catch {
      earningsDate = null;
    }
  }
  
  // Extract ex-dividend date
  let exDividendDate: string | null = null;
  const exDividendDateRaw = safeGet(calendarEvents, 'exDividendDate');
  if (exDividendDateRaw) {
    try {
      if (typeof exDividendDateRaw === 'number') {
        exDividendDate = new Date(exDividendDateRaw * 1000).toISOString().split('T')[0];
      } else if (typeof exDividendDateRaw === 'string') {
        exDividendDate = new Date(exDividendDateRaw).toISOString().split('T')[0];
      } else if (exDividendDateRaw.raw) {
        const raw = typeof exDividendDateRaw.raw === 'number' ? exDividendDateRaw.raw * 1000 : exDividendDateRaw.raw;
        exDividendDate = new Date(raw).toISOString().split('T')[0];
      }
    } catch {
      exDividendDate = null;
    }
  }
  
  // Extract earnings estimates
  const earningsEstData = calendarEvents.earnings || {};
  const earningsAverage = asFloat(safeGet(earningsEstData, 'earningsAverage'));
  const earningsLow = asFloat(safeGet(earningsEstData, 'earningsLow'));
  const earningsHigh = asFloat(safeGet(earningsEstData, 'earningsHigh'));
  const revenueAverage = asInt(safeGet(earningsEstData, 'revenueAverage'));
  const revenueLow = asInt(safeGet(earningsEstData, 'revenueLow'));
  const revenueHigh = asInt(safeGet(earningsEstData, 'revenueHigh'));
  
  return {
    ipoDate,
    earningsDate,
    exDividendDate,
    earningsAverage,
    earningsLow,
    earningsHigh,
    revenueAverage,
    revenueLow,
    revenueHigh,
  };
}

// Extract data from assetProfile module
function extractFromAssetProfile(data: any): Partial<{
  sector: string | null;
  industry: string | null;
  companyDescription: string | null;
  fullTimeEmployees: number | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}> {
  const assetProfile = data.assetProfile || {};
  
  let desc = safeGet(assetProfile, 'longBusinessSummary');
  if (typeof desc === 'string') {
    desc = desc.trim().replace(/\n/g, ' ');
    const parts = desc.split('. ');
    desc =
      parts.length > 1
        ? parts[0].trim() + '.'
        : desc.slice(0, 220).trim() + (desc.length > 220 ? '…' : '');
  } else {
    desc = null;
  }
  
  return {
    sector: safeGet(assetProfile, 'sector') || null,
    industry: safeGet(assetProfile, 'industry') || null,
    companyDescription: desc,
    fullTimeEmployees: asInt(safeGet(assetProfile, 'fullTimeEmployees')),
    website: safeGet(assetProfile, 'website') || null,
    city: safeGet(assetProfile, 'city') || null,
    state: safeGet(assetProfile, 'state') || null,
    country: safeGet(assetProfile, 'country') || null,
  };
}

// Extract data from institutionOwnership module
function extractFromInstitutionOwnership(data: any): Partial<{
  institutionalOwnership: number | null;
}> {
  const institutionOwnership = data.institutionOwnership || {};
  const ownershipHistory = institutionOwnership.history || [];
  
  // Get the most recent ownership percentage
  if (ownershipHistory && ownershipHistory.length > 0) {
    const latest = ownershipHistory[ownershipHistory.length - 1];
    const pct = asFloat(safeGet(latest, 'pctHeld'));
    if (pct !== null) {
      return { institutionalOwnership: pct };
    }
  }
  
  // Fallback to direct percentage
  const pct = asFloat(safeGet(institutionOwnership, 'pctHeld'));
  return { institutionalOwnership: pct };
}

// Extract data from majorHoldersBreakdown module
function extractFromMajorHoldersBreakdown(data: any): Partial<{
  institutionalOwnership: number | null;
}> {
  const majorHolders = data.majorHoldersBreakdown || {};
  const institutions = asFloat(safeGet(majorHolders, 'institutionsPercentHeld'));
  
  return {
    institutionalOwnership: institutions,
  };
}

function assessDataQuality(data: {
  marketCap: number | null | undefined;
  float: number | null | undefined;
  sharesOutstanding: number | null | undefined;
  sector: string | null | undefined;
  floatShares?: number | null;
  usedFallback?: boolean;
  dataSources?: string[];
  ipoDate?: string | null;
}): { quality: 'complete' | 'partial' | 'minimal' | 'unavailable'; message?: string } {
  const isIPO = data.ipoDate !== null && data.ipoDate !== undefined;
  const hasComprehensiveData = data.dataSources?.includes('primaryComprehensive') || 
                               data.dataSources?.includes('fundamentals');
  
  // Define key fields - for IPO stocks, we adjust expectations
  const keyFields = [
    { name: 'marketCap', value: data.marketCap, required: true },
    { name: 'sharesOutstanding', value: data.sharesOutstanding, required: !isIPO }, // IPO stocks may not have this immediately
    { name: 'sector', value: data.sector, required: false },
    { name: 'float', value: data.float || data.floatShares, required: false }, // May not be available for new IPOs
  ];

  const populatedFields = keyFields.filter((field) => field.value !== null && field.value !== undefined);
  const requiredFields = keyFields.filter((field) => field.required);
  const populatedRequiredFields = requiredFields.filter((field) => field.value !== null && field.value !== undefined);
  
  // Check if we have all required fields
  const hasAllRequired = requiredFields.length === populatedRequiredFields.length;
  
  // Calculate coverage ratio
  const ratio = populatedFields.length / keyFields.length;

  // For IPO stocks, be more lenient with quality assessment
  if (isIPO) {
    // IPO stocks with comprehensive data source and marketCap are at least partial
    if (hasComprehensiveData && data.marketCap !== null) {
      if (ratio >= 0.6 && hasAllRequired) {
        return {
          quality: 'complete',
          message: 'Complete data for recent IPO',
        };
      }
      if (ratio >= 0.4 && hasAllRequired) {
        return {
          quality: 'partial',
          message: 'Partial data - newly IPO\'d stock, some fields may not be available yet',
        };
      }
      return {
        quality: 'partial',
        message: 'Limited data - newly IPO\'d stock, additional data may become available over time',
      };
    }
    
    // IPO stock with just price data
    if (data.marketCap !== null) {
      return {
        quality: 'minimal',
        message: 'Minimal data - newly IPO\'d stock, fundamental data may not be available yet',
      };
    }
  }
  
  // For established stocks, use stricter criteria
  if (hasComprehensiveData) {
    if (ratio >= 0.75 && hasAllRequired) {
      return { quality: 'complete' };
    }
    if (ratio >= 0.5 && hasAllRequired) {
      return {
        quality: 'partial',
        message: 'Some data unavailable',
      };
    }
  }
  
  // If we have price data but no comprehensive data
  if (data.marketCap !== null) {
    if (data.dataSources?.includes('priceModules') || data.dataSources?.includes('quote')) {
      return {
        quality: 'partial',
        message: 'Partial data - fundamental data may not be available',
      };
    }
    return {
      quality: 'minimal',
      message: 'Limited data - may be a new listing or data unavailable',
    };
  }

  return {
    quality: 'unavailable',
    message: 'Data unavailable',
  };
}

async function detectLastReverseSplit(symbol: string): Promise<[string | null, string | null]> {
  try {
    const quote = await yahooFinance.quoteSummary(symbol, {
      modules: ["defaultKeyStatistics"],
    });

    // For reverse splits, we'd need to check splits data
    // yahoo-finance2 doesn't have direct splits access like yfinance
    // We'll check if there's split data available
    // For now, return null - this can be enhanced if needed
    return [null, null];
  } catch {
    return [null, null];
  }
}

async function getSharesHistoryYoYChange(symbol: string, currentShares: number | null): Promise<number | null> {
  if (currentShares === null || currentShares <= 0) {
    return null;
  }

  try {
    // Use fundamentalsTimeSeries API (recommended replacement for deprecated incomeStatementHistory)
    // Calculate date range: need data from approximately 1 year ago
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // Try quarterly data first (more granular)
    try {
      const quarterlyData = await yahooFinance.fundamentalsTimeSeries(symbol, {
        period1: oneYearAgo,
        period2: now,
        type: 'sharesOutstanding',
        module: 'balanceSheetHistoryQuarterly',
      });

      if (quarterlyData && Array.isArray(quarterlyData) && quarterlyData.length >= 4) {
        // Get data from 4 quarters ago (approximately 1 year)
        const yearAgoData = quarterlyData[quarterlyData.length - 4];
        const yearAgoShares = asInt(safeGet(yearAgoData, "sharesOutstanding")) || 
                             asInt(safeGet(yearAgoData, "commonStock"));
        
        if (yearAgoShares !== null && yearAgoShares > 0) {
          const dilution = (currentShares - yearAgoShares) / yearAgoShares;
          // Validate: reasonable dilution should be between -50% and +500%
          if (dilution >= -0.5 && dilution <= 5.0) {
            return dilution;
          }
        }
      }
    } catch (quarterlyError) {
      // Fall through to annual data
    }

    // Fallback to annual data
    try {
      const annualData = await yahooFinance.fundamentalsTimeSeries(symbol, {
        period1: oneYearAgo,
        period2: now,
        type: 'sharesOutstanding',
        module: 'balanceSheetHistory',
      });

      if (annualData && Array.isArray(annualData) && annualData.length >= 2) {
        // Get data from 1 year ago
        const yearAgoData = annualData[annualData.length - 2];
        const yearAgoShares = asInt(safeGet(yearAgoData, "sharesOutstanding")) || 
                             asInt(safeGet(yearAgoData, "commonStock"));
        
        if (yearAgoShares !== null && yearAgoShares > 0) {
          const dilution = (currentShares - yearAgoShares) / yearAgoShares;
          // Validate: reasonable dilution should be between -50% and +500%
          if (dilution >= -0.5 && dilution <= 5.0) {
            return dilution;
          }
        }
      }
    } catch (annualError) {
      // Fall through to return null
    }

    return null;
  } catch (error) {
    // If fundamentalsTimeSeries fails completely, return null
    return null;
  }
}

// Helper function to extract price from transaction text
function extractPriceFromText(text: string): number | null {
  if (!text) return null;
  
  // Look for patterns like "at price 305.62 per share" or "at $305.62"
  const pricePatterns = [
    /(?:at|@)\s*(?:price|priced)\s*(?:of\s*)?\$?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)\s*(?:per\s*share|each)/i,
    /(?:price|priced)\s*(?:at|of)\s*\$?\s*([\d,]+\.?\d*)/i,
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  
  return null;
}

// Helper function to determine executive weight based on role
function getExecutiveWeight(filerRelation: string | null): number {
  if (!filerRelation) return 1.0;
  
  const relation = filerRelation.toLowerCase();
  
  // CEO and CFO get 2x weight (most predictive per research)
  if (relation.includes('chief executive officer') || relation.includes('ceo')) {
    return 2.0;
  }
  if (relation.includes('chief financial officer') || relation.includes('cfo')) {
    return 2.0;
  }
  
  // Other officers and directors get 1.5x weight
  if (relation.includes('officer') || relation.includes('director') || 
      relation.includes('president') || relation.includes('vp') ||
      relation.includes('vice president')) {
    return 1.5;
  }
  
  // Others get 1x weight
  return 1.0;
}

async function analyzeInsiderTransactions(symbol: string, currentPrice: number | null): Promise<{
  netBuying: number;
  transactionCount: number;
  executiveBuying: number;
  clusterDetected: boolean;
} | null> {
  try {
    const quote = await yahooFinance.quoteSummary(symbol, {
      modules: ["insiderTransactions"],
    });

    const transactions = quote.insiderTransactions;
    if (!transactions || !transactions.transactions || transactions.transactions.length === 0) {
      return null;
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    let netBuying = 0;
    let executiveBuying = 0;
    let transactionCount = 0;
    const buyTransactions: Array<{ date: Date; value: number; filerName: string }> = [];

    for (const transaction of transactions.transactions) {
      const transDate = safeGet(transaction, "startDate");
      if (!transDate) continue;

      const date = new Date(transDate);
      if (date < ninetyDaysAgo) continue; // Skip transactions older than 90 days

      const shares = asInt(safeGet(transaction, "shares"));
      const value = asFloat(safeGet(transaction, "value"));
      const transactionCode = safeGet(transaction, "transactionCode");
      const transactionText = safeGet(transaction, "transactionText") || "";
      const filerRelation = safeGet(transaction, "filerRelation");
      const filerName = safeGet(transaction, "filerName") || "";

      // Determine if it's a buy or sell
      const isBuy = 
        transactionCode === "P" ||
        transactionText.toLowerCase().includes("buy") ||
        transactionText.toLowerCase().includes("purchase") ||
        transactionText.toLowerCase().includes("acquired") ||
        transactionText.toLowerCase().includes("bought");

      const isSell =
        transactionCode === "S" ||
        transactionText.toLowerCase().includes("sell") ||
        transactionText.toLowerCase().includes("sale") ||
        transactionText.toLowerCase().includes("disposed") ||
        transactionText.toLowerCase().includes("sold");

      if (!isBuy && !isSell) continue; // Skip if we can't determine type

      // Calculate transaction value with improved extraction
      let transactionValue = value;
      
      if (transactionValue === null && shares !== null) {
        // Try to extract price from transaction text
        const extractedPrice = extractPriceFromText(transactionText);
        if (extractedPrice !== null) {
          transactionValue = shares * extractedPrice;
        } else if (currentPrice !== null && currentPrice > 0) {
          // Fallback: use current stock price (less accurate but better than nothing)
          transactionValue = shares * currentPrice;
        } else {
          // Last resort: use shares as proxy (very inaccurate)
          transactionValue = shares;
        }
      }

      if (transactionValue === null || transactionValue <= 0) continue;

      // Apply executive weighting
      const weight = getExecutiveWeight(filerRelation);
      const weightedValue = transactionValue * weight;

      if (isBuy) {
        netBuying += transactionValue;
        executiveBuying += weightedValue;
        transactionCount++;
        
        // Track buy transactions for cluster detection (within 60 days)
        if (date >= sixtyDaysAgo) {
          buyTransactions.push({ date, value: transactionValue, filerName: String(filerName) });
        }
      } else if (isSell) {
        netBuying -= transactionValue;
        executiveBuying -= weightedValue;
        transactionCount++;
      }
    }

    // Detect insider clusters: 3+ unique insiders buying within 60 days
    let clusterDetected = false;
    if (buyTransactions.length >= 3) {
      const uniqueBuyers = new Set(buyTransactions.map(t => t.filerName));
      if (uniqueBuyers.size >= 3) {
        // Check if transactions are within 60 days of each other
        const sortedDates = buyTransactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
        const timeSpan = sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime();
        const daysSpan = timeSpan / (24 * 60 * 60 * 1000);
        
        if (daysSpan <= 60) {
          clusterDetected = true;
        }
      }
    }

    // Only return if we have meaningful data (at least one transaction)
    if (transactionCount === 0) {
      return null;
    }

    return {
      netBuying,
      transactionCount,
      executiveBuying,
      clusterDetected,
    };
  } catch {
    return null;
  }
}

// Helper to merge extracted data into collectedData without overwriting existing non-null values
function mergeExtractedData(
  collectedData: any,
  extracted: any,
  dataSource: string
): void {
  for (const key in extracted) {
    if (extracted[key] !== null && extracted[key] !== undefined) {
      // Only assign if current value is null/undefined or if it's a string field we want to prefer longer descriptions
      if (collectedData[key] === null || collectedData[key] === undefined) {
        collectedData[key] = extracted[key];
      } else if (key === 'companyDescription' && typeof extracted[key] === 'string') {
        // Prefer longer descriptions
        if (extracted[key].length > (collectedData[key]?.length || 0)) {
          collectedData[key] = extracted[key];
        }
      }
    }
  }
}

async function pullRow(ticker: string) {
  const collectedData: Partial<TickerData> = {
    ticker: ticker.toUpperCase().trim(),
    flags: [],
  };
  
  const dataSources: string[] = [];
  let quoteData: any = null;
  let ipoDate: string | null = null; // Store IPO date for data quality assessment
  
  // PRIMARY: Comprehensive module combination optimized for IPO stocks
  try {
    const data = await yahooFinance.quoteSummary(ticker, {
      modules: [
        'price',
        'quoteType',
        'summaryDetail',
        'summaryProfile',
        'defaultKeyStatistics',
        'financialData',
        'calendarEvents', // Important for IPO dates
        'assetProfile', // Additional company info
      ],
    });
    
    // Extract from all available modules
    const priceExtracted = extractFromPriceModules(data);
    mergeExtractedData(collectedData, priceExtracted, 'primary');
    
    const summaryDetailExtracted = extractFromSummaryDetail(data);
    mergeExtractedData(collectedData, summaryDetailExtracted, 'primary');
    
    const fundamentalsExtracted = extractFromFundamentals(data);
    mergeExtractedData(collectedData, fundamentalsExtracted, 'primary');
    
    const financialDataExtracted = extractFromFinancialData(data);
    mergeExtractedData(collectedData, financialDataExtracted, 'primary');
    
    const calendarExtracted = extractFromCalendarEvents(data);
    mergeExtractedData(collectedData, calendarExtracted, 'primary');
    ipoDate = calendarExtracted.ipoDate || null; // Store for later use
    
    const assetExtracted = extractFromAssetProfile(data);
    mergeExtractedData(collectedData, assetExtracted, 'primary');
    
    dataSources.push('primaryComprehensive');
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${ticker}] Primary (comprehensive) succeeded`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${ticker}] Primary (comprehensive) failed:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  // SECONDARY: Try quote() method for real-time data
  try {
    quoteData = await yahooFinance.quote(ticker);
    const extracted = extractFromQuote(quoteData);
    mergeExtractedData(collectedData, extracted, 'quote');
    dataSources.push('quote');
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${ticker}] Secondary (quote) succeeded`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${ticker}] Secondary (quote) failed:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  // If we still don't have summaryDetail data, try it separately
  if (!collectedData.fiftyTwoWeekHigh && !collectedData.averageVolume) {
    try {
      const summaryData = await yahooFinance.quoteSummary(ticker, {
        modules: ['summaryDetail'],
      });
      const summaryExtracted = extractFromSummaryDetail(summaryData);
      mergeExtractedData(collectedData, summaryExtracted, 'summaryDetail');
      dataSources.push('summaryDetail');
    } catch (error) {
      // Silent fail
    }
  }
  
  // TERTIARY: Try individual modules for missing critical fields
  // Only try if we're missing critical data
  
  // If missing float, try defaultKeyStatistics alone
  if (!collectedData.float) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: ['defaultKeyStatistics'],
      });
      const extracted = extractFromFundamentals(data);
      if (extracted.float !== null) {
        collectedData.float = extracted.float;
        collectedData.shortFloatShares = extracted.shortFloatShares;
        collectedData.pctFloatShort = extracted.pctFloatShort;
      }
      dataSources.push('defaultKeyStatistics');
    } catch (error) {
      // Silent fail for individual module attempts
    }
  }
  
  // If missing sector, try summaryProfile or assetProfile alone
  if (!collectedData.sector) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: ['summaryProfile', 'assetProfile'],
      });
      const profileExtracted = extractFromFundamentals(data);
      const assetExtracted = extractFromAssetProfile(data);
      if (profileExtracted.sector) collectedData.sector = profileExtracted.sector;
      if (assetExtracted.sector && !collectedData.sector) collectedData.sector = assetExtracted.sector;
      dataSources.push('profileModules');
    } catch (error) {
      // Silent fail
    }
  }
  
  // If missing marketCap, try price or quote alone
  if (!collectedData.marketCap) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: ['price'],
      });
      const extracted = extractFromPriceModules(data);
      if (extracted.marketCap !== null) {
        collectedData.marketCap = extracted.marketCap;
      }
      dataSources.push('priceOnly');
    } catch (error) {
      // Silent fail
    }
  }
  
  // If missing institutional ownership, try ownership modules
  if (collectedData.institutionalOwnership === null) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: ['institutionOwnership', 'majorHoldersBreakdown'],
      });
      const instExtracted = extractFromInstitutionOwnership(data);
      const holdersExtracted = extractFromMajorHoldersBreakdown(data);
      if (instExtracted.institutionalOwnership !== null) {
        collectedData.institutionalOwnership = instExtracted.institutionalOwnership;
      } else if (holdersExtracted.institutionalOwnership !== null) {
        collectedData.institutionalOwnership = holdersExtracted.institutionalOwnership;
      }
      dataSources.push('ownershipModules');
    } catch (error) {
      // Silent fail
    }
  }
  
  // QUATERNARY: Try alternative comprehensive combination
  if (!collectedData.marketCap || !collectedData.sharesOutstanding) {
    try {
      const data = await yahooFinance.quoteSummary(ticker, {
        modules: ['price', 'summaryDetail', 'quoteType', 'defaultKeyStatistics'],
      });
      const priceExtracted = extractFromPriceModules(data);
      const fundamentalsExtracted = extractFromFundamentals(data);
      mergeExtractedData(collectedData, priceExtracted, 'alternative');
      mergeExtractedData(collectedData, fundamentalsExtracted, 'alternative');
      dataSources.push('alternativeComprehensive');
    } catch (error) {
      // Silent fail
    }
  }
  
  // LAST RESORT: Try search() to verify ticker exists
  if (!collectedData.marketCap && dataSources.length === 0) {
    try {
      const searchResults = await yahooFinance.search(ticker);
      if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
        // Ticker exists but no data available
        dataSources.push('searchVerified');
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  // If we have no data at all, throw error
  if (!collectedData.marketCap && dataSources.length === 0) {
    throw new Error('All data retrieval methods failed');
  }
  
  // Calculate derived fields
  const floatShares = collectedData.float ?? null;
  const sharesShort = collectedData.shortFloatShares ?? null;
  const pctFloatShort = collectedData.pctFloatShort ?? 
    (floatShares && sharesShort ? sharesShort / floatShares : null);
  collectedData.pctFloatShort = pctFloatShort;
  
  const sharesOut = collectedData.sharesOutstanding ?? null;
  const marketCap = collectedData.marketCap ?? null;
  const totalCash = collectedData.totalCash ?? null;
  const freeCashFlow = collectedData.freeCashFlowTTM ?? null;
  
  // Additional data processing
  const [rsDate, rsRatio] = await detectLastReverseSplit(ticker);
  collectedData.lastReverseSplitDate = rsDate;
  collectedData.reverseSplitRatio = rsRatio;
  
  const dilutionYoY = await getSharesHistoryYoYChange(ticker, sharesOut);
  collectedData.dilutionYoY = dilutionYoY;
  
  // Get current price for insider transaction analysis
  const currentPrice = marketCap && sharesOut ? marketCap / sharesOut : null;
  const insiderTransactionData = await analyzeInsiderTransactions(ticker, currentPrice);
  collectedData.insiderTransactionData = insiderTransactionData;
  collectedData.insiderBuyNet90d = insiderTransactionData ? insiderTransactionData.netBuying : null;
  
  // Calculate cash runway
  let runwayMonths: number | null = null;
  if (totalCash !== null && freeCashFlow !== null && freeCashFlow < 0) {
    const burnPerMonth = -freeCashFlow / 12.0;
    if (burnPerMonth > 0) {
      runwayMonths = totalCash / burnPerMonth;
    }
  }
  collectedData.cashRunwayMonths = runwayMonths;
  
  // Generate flags
  const flags: string[] = [];
  if (
    floatShares !== null &&
    floatShares < 20_000_000 &&
    (pctFloatShort || 0) > 0.2
  ) {
    flags.push("High short + Low float");
  }
  if (rsDate !== null) {
    flags.push("Has reverse split history");
  }
  if (runwayMonths !== null && runwayMonths < 12) {
    flags.push("Cash runway < 12mo (est.)");
  }
  
  // Dilution flags - show actual percentage
  if (dilutionYoY !== null && dilutionYoY > 0.20) {
    flags.push(`High dilution (${(dilutionYoY * 100).toFixed(1)}% YoY)`);
  } else if (dilutionYoY !== null && dilutionYoY > 0.10) {
    flags.push(`Moderate dilution (${(dilutionYoY * 100).toFixed(1)}% YoY)`);
  }
  if (dilutionYoY !== null && dilutionYoY < -0.05) {
    flags.push(`Share buybacks (${Math.abs(dilutionYoY * 100).toFixed(1)}% YoY)`);
  }
  
  // Insider transaction flags - show value and context
  if (insiderTransactionData) {
    const { netBuying, clusterDetected, executiveBuying } = insiderTransactionData;
    
    // Use tiered thresholds based on market cap
    const thresholdSmall = marketCap && marketCap < 100_000_000 ? 50_000 : 100_000;
    const thresholdMedium = marketCap && marketCap < 1_000_000_000 ? 250_000 : 500_000;
    const thresholdLarge = 1_000_000;
    
    if (netBuying > thresholdLarge || (clusterDetected && netBuying > thresholdSmall)) {
      const amount = formatCurrency(Math.abs(netBuying));
      if (clusterDetected) {
        flags.push(`Insider cluster buying (${amount}, 90d)`);
      } else if (executiveBuying > thresholdMedium) {
        flags.push(`Executive buying (${amount}, 90d)`);
      } else {
        flags.push(`Net insider buying (${amount}, 90d)`);
      }
    } else if (netBuying > thresholdSmall && !clusterDetected) {
      const amount = formatCurrency(Math.abs(netBuying));
      flags.push(`Net insider buying (${amount}, 90d)`);
    }
    
    if (netBuying < -thresholdLarge) {
      const amount = formatCurrency(Math.abs(netBuying));
      flags.push(`Net insider selling (${amount}, 90d)`);
    } else if (netBuying < -thresholdSmall) {
      const amount = formatCurrency(Math.abs(netBuying));
      flags.push(`Net insider selling (${amount}, 90d)`);
    }
  }
  collectedData.flags = flags;
  
  // If we don't have IPO date yet, try to get it from calendarEvents
  if (!ipoDate) {
    try {
      const calendarData = await yahooFinance.quoteSummary(ticker, {
        modules: ['calendarEvents'],
      });
      const calendarExtracted = extractFromCalendarEvents(calendarData);
      if (calendarExtracted.ipoDate) {
        ipoDate = calendarExtracted.ipoDate;
      }
    } catch {
      // Silent fail - IPO date is optional
    }
  }
  
  // Assess data quality
  const dataQualityResult = assessDataQuality({
    marketCap: collectedData.marketCap ?? null,
    float: collectedData.float ?? null,
    sharesOutstanding: collectedData.sharesOutstanding ?? null,
    sector: collectedData.sector ?? null,
    dataSources,
    usedFallback: !dataSources.includes('primaryComprehensive') && 
                  !dataSources.includes('fundamentals') && 
                  !dataSources.includes('priceModules'),
    ipoDate,
  });
  collectedData.dataQuality = dataQualityResult.quality;
  collectedData.dataQualityMessage = dataQualityResult.message;
  
  // Log data quality for debugging (development only)
  if (process.env.NODE_ENV === 'development' && dataQualityResult.quality !== 'complete') {
    console.warn(`[${ticker}] Data quality: ${dataQualityResult.quality}`, dataQualityResult.message);
    console.log(`[${ticker}] Data sources: ${dataSources.join(', ')}`);
  }
  
  collectedData.lastUpdated = new Date().toISOString();
  
  // Ensure all required fields are set (even if null)
  return {
    ticker: collectedData.ticker!,
    float: collectedData.float ?? null,
    shortFloatShares: collectedData.shortFloatShares ?? null,
    pctFloatShort: collectedData.pctFloatShort ?? null,
    institutionalOwnership: collectedData.institutionalOwnership ?? null,
    lastReverseSplitDate: collectedData.lastReverseSplitDate ?? null,
    reverseSplitRatio: collectedData.reverseSplitRatio ?? null,
    sector: collectedData.sector ?? null,
    companyDescription: collectedData.companyDescription ?? null,
    marketCap: collectedData.marketCap ?? null,
    totalCash: collectedData.totalCash ?? null,
    freeCashFlowTTM: collectedData.freeCashFlowTTM ?? null,
    cashRunwayMonths: collectedData.cashRunwayMonths ?? null,
    sharesOutstanding: collectedData.sharesOutstanding ?? null,
    dilutionYoY: collectedData.dilutionYoY ?? null,
    insiderBuyNet90d: collectedData.insiderBuyNet90d ?? null,
    insiderTransactionData: collectedData.insiderTransactionData ?? null,
    flags: collectedData.flags ?? [],
    dataQuality: collectedData.dataQuality!,
    dataQualityMessage: collectedData.dataQualityMessage,
    lastUpdated: collectedData.lastUpdated!,
    // Price & Trading Data
    regularMarketPrice: collectedData.regularMarketPrice ?? null,
    previousClose: collectedData.previousClose ?? null,
    dayHigh: collectedData.dayHigh ?? null,
    dayLow: collectedData.dayLow ?? null,
    fiftyTwoWeekHigh: collectedData.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: collectedData.fiftyTwoWeekLow ?? null,
    volume: collectedData.volume ?? null,
    averageVolume: collectedData.averageVolume ?? null,
    // Analyst Data
    targetHighPrice: collectedData.targetHighPrice ?? null,
    targetLowPrice: collectedData.targetLowPrice ?? null,
    targetMeanPrice: collectedData.targetMeanPrice ?? null,
    recommendationMean: collectedData.recommendationMean ?? null,
    numberOfAnalystOpinions: collectedData.numberOfAnalystOpinions ?? null,
    // Earnings Estimates
    earningsAverage: collectedData.earningsAverage ?? null,
    earningsLow: collectedData.earningsLow ?? null,
    earningsHigh: collectedData.earningsHigh ?? null,
    revenueAverage: collectedData.revenueAverage ?? null,
    revenueLow: collectedData.revenueLow ?? null,
    revenueHigh: collectedData.revenueHigh ?? null,
    // Additional Context
    currency: collectedData.currency ?? null,
    exchange: collectedData.exchange ?? null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol?.toUpperCase().trim();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Ticker symbol required" },
        { status: 400 }
      );
    }

    try {
      const data = await pullRow(symbol);
      return NextResponse.json({
        success: true,
        data: data,
      });
    } catch (apiError: any) {
      // Handle rate limiting and other API errors
      const errorMessage = apiError?.message || String(apiError);
      if (errorMessage.includes("Too Many Requests") || errorMessage.includes("rate limit")) {
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded. Please try again in a moment.",
          },
          { status: 429 }
        );
      }
      throw apiError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch ticker data",
      },
      { status: 500 }
    );
  }
}
