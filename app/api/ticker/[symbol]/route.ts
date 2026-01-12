import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

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

async function getSharesHistoryYoYChange(symbol: string): Promise<number | null> {
  try {
    // Get historical shares outstanding data
    // yahoo-finance2 doesn't have direct shares history like yfinance
    // We can try to get it from quoteSummary if available
    // For now, return null - this can be enhanced if needed
    return null;
  } catch {
    return null;
  }
}

async function pullRow(ticker: string) {
  try {
    const quote = await yahooFinance.quoteSummary(ticker, {
      modules: [
        "summaryProfile",
        "defaultKeyStatistics",
        "financialData",
        "quoteType",
      ],
    });

    const info = quote.defaultKeyStatistics || {};
    const profile = quote.summaryProfile || {};
    const financialData = quote.financialData || {};

    const floatShares = asInt(safeGet(info, "floatShares"));
    const sharesShort = asInt(safeGet(info, "sharesShort"));
    const heldInst = asFloat(safeGet(info, "heldPercentInstitutions"));
    const sector = safeGet(profile, "sector") || safeGet(info, "sector");

    let desc = safeGet(profile, "longBusinessSummary");
    if (typeof desc === "string") {
      desc = desc.trim().replace(/\n/g, " ");
      const parts = desc.split(". ");
      desc =
        parts.length > 1
          ? parts[0].trim() + "."
          : desc.slice(0, 220).trim() + (desc.length > 220 ? "…" : "");
    } else {
      desc = null;
    }

    const marketCap = asInt(safeGet(info, "marketCap"));
    const totalCash = asInt(safeGet(financialData, "totalCash"));
    const freeCashFlow = asInt(safeGet(financialData, "freeCashflow"));
    const sharesOut = asInt(safeGet(info, "sharesOutstanding"));

    const pctFloatShort =
      floatShares && sharesShort ? sharesShort / floatShares : null;

    const [rsDate, rsRatio] = await detectLastReverseSplit(ticker);
    const dilutionYoY = await getSharesHistoryYoYChange(ticker);

    let runwayMonths: number | null = null;
    if (totalCash !== null && freeCashFlow !== null && freeCashFlow < 0) {
      const burnPerMonth = -freeCashFlow / 12.0;
      if (burnPerMonth > 0) {
        runwayMonths = totalCash / burnPerMonth;
      }
    }

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
    if (dilutionYoY !== null && dilutionYoY > 0.1) {
      flags.push("Shares up YoY (dilution?)");
    }

    return {
      ticker: ticker.toUpperCase().trim(),
      float: floatShares,
      shortFloatShares: sharesShort,
      pctFloatShort: pctFloatShort,
      institutionalOwnership: heldInst,
      lastReverseSplitDate: rsDate,
      reverseSplitRatio: rsRatio,
      sector: sector,
      companyDescription: desc,
      marketCap: marketCap,
      totalCash: totalCash,
      freeCashFlowTTM: freeCashFlow,
      cashRunwayMonths: runwayMonths,
      sharesOutstanding: sharesOut,
      dilutionYoY: dilutionYoY,
      flags: flags,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    // If quoteSummary fails, try alternative approach
    try {
      const quote = await yahooFinance.quote(ticker);
      // Fallback to basic quote data
      return {
        ticker: ticker.toUpperCase().trim(),
        float: null,
        shortFloatShares: null,
        pctFloatShort: null,
        institutionalOwnership: null,
        lastReverseSplitDate: null,
        reverseSplitRatio: null,
        sector: null,
        companyDescription: null,
        marketCap: quote.marketCap ? asInt(quote.marketCap) : null,
        totalCash: null,
        freeCashFlowTTM: null,
        cashRunwayMonths: null,
        sharesOutstanding: null,
        dilutionYoY: null,
        flags: [],
        lastUpdated: new Date().toISOString(),
      };
    } catch {
      throw error;
    }
  }
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
