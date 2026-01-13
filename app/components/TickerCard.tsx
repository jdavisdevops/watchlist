"use client";

import { TickerData } from "@/lib/tickerData";
import FlagBadge from "./FlagBadge";

interface TickerCardProps {
  data: TickerData;
  onRemove: (symbol: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function TickerCard({ data, onRemove, isExpanded, onToggleExpand }: TickerCardProps) {

  const formatNumber = (val: number | null): string => {
    if (val === null) return "-";
    if (val >= 1_000_000_000) {
      return `$${(val / 1_000_000_000).toFixed(1)}B`;
    }
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const formatPercent = (val: number | null): string => {
    if (val === null) return "-";
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatDate = (val: string | null): string => {
    if (!val) return "-";
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return val;
    }
  };

  const formatPrice = (val: number | null): string => {
    if (val === null) return "-";
    return `$${val.toFixed(2)}`;
  };

  const formatVolume = (val: number | null): string => {
    if (val === null) return "-";
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(2)}B`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(2)}K`;
    }
    return val.toLocaleString();
  };

  const formatShares = (val: number | null): string => {
    if (val === null) return "-";
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)}B`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const formatRecommendation = (val: number | null): string => {
    if (val === null) return "-";
    // recommendationMean: 1 = Strong Buy, 2 = Buy, 3 = Hold, 4 = Underperform, 5 = Sell
    const recommendations = ["", "Strong Buy", "Buy", "Hold", "Underperform", "Sell"];
    if (val >= 1 && val <= 5) {
      return `${recommendations[Math.round(val)]} (${val.toFixed(1)})`;
    }
    return val.toFixed(1);
  };

  const formatRange = (low: number | null, high: number | null): string => {
    if (low === null && high === null) return "-";
    if (low === null) return formatPrice(high);
    if (high === null) return formatPrice(low);
    // Use non-breaking space and format numbers appropriately
    if (Math.abs(low) < 1 && Math.abs(high) < 1) {
      // For small numbers like earnings, use price format
      return `${formatPrice(low)} - ${formatPrice(high)}`;
    } else if (low >= 1_000_000 || high >= 1_000_000) {
      // For large numbers, use number format
      return `${formatNumber(low)} - ${formatNumber(high)}`;
    } else {
      // For medium numbers, use price format
      return `${formatPrice(low)} - ${formatPrice(high)}`;
    }
  };

  // Smart fallback logic for main card metrics
  const getFloatDisplay = () => {
    if (data.float !== null) return { label: "Float", value: formatShares(data.float) };
    if (data.sharesOutstanding !== null) return { label: "Shares Out", value: formatShares(data.sharesOutstanding) };
    return { label: "Float", value: "-" };
  };

  const getShortPercentDisplay = () => {
    if (data.pctFloatShort !== null) return { label: "Short %", value: formatPercent(data.pctFloatShort) };
    if (data.regularMarketPrice !== null) return { label: "Price", value: formatPrice(data.regularMarketPrice) };
    return { label: "Short %", value: "-" };
  };

  const getInstitutionalOwnershipDisplay = () => {
    if (data.institutionalOwnership !== null) return { label: "Inst. Own", value: formatPercent(data.institutionalOwnership) };
    if (data.volume !== null) return { label: "Volume", value: formatVolume(data.volume) };
    if (data.fiftyTwoWeekHigh !== null && data.fiftyTwoWeekLow !== null) {
      return { label: "52W Range", value: `$${data.fiftyTwoWeekLow.toFixed(2)}-${data.fiftyTwoWeekHigh.toFixed(2)}` };
    }
    return { label: "Inst. Own", value: "-" };
  };

  const floatDisplay = getFloatDisplay();
  const shortDisplay = getShortPercentDisplay();
  const instDisplay = getInstitutionalOwnershipDisplay();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header - Always Visible */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Data Quality Indicator */}
        {data.dataQuality && data.dataQuality !== 'complete' && (
          <div className={`mb-3 px-3 py-2 rounded text-sm border ${
            data.dataQuality === 'partial' 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
              : 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
          }`}>
            <span className="font-medium">
              {data.dataQuality === 'partial' ? '⚠️' : 'ℹ️'} 
              {' '}
              {data.dataQualityMessage || 'Limited data available'}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.ticker}</h3>
            {data.sector && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                {data.sector}
              </span>
            )}
          </div>
          <button
            onClick={() => onRemove(data.ticker)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-sm"
          >
            Remove
          </button>
        </div>

        {/* Key Metrics - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Market Cap</span>
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {formatNumber(data.marketCap)}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{floatDisplay.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {floatDisplay.value}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{shortDisplay.label}</span>
            <span
              className={`font-semibold truncate ${
                data.pctFloatShort && data.pctFloatShort > 0.2
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {shortDisplay.value}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{instDisplay.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {instDisplay.value}
            </span>
          </div>
        </div>

        {/* Flags */}
        {data.flags.length > 0 && (
          <div className="mt-3">
            <FlagBadge flags={data.flags} />
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpand}
          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <span>▲</span> Collapse
            </>
          ) : (
            <>
              <span>▼</span> Expand
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Section 1: Price & Trading */}
          {(data.regularMarketPrice !== null || data.volume !== null || data.fiftyTwoWeekHigh !== null) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Price & Trading</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {data.regularMarketPrice !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.regularMarketPrice)}</span>
                  </div>
                )}
                {data.previousClose !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Previous Close:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.previousClose)}</span>
                  </div>
                )}
                {data.dayHigh !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Day High:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.dayHigh)}</span>
                  </div>
                )}
                {data.dayLow !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Day Low:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.dayLow)}</span>
                  </div>
                )}
                {data.fiftyTwoWeekHigh !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">52 Week High:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.fiftyTwoWeekHigh)}</span>
                  </div>
                )}
                {data.fiftyTwoWeekLow !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">52 Week Low:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.fiftyTwoWeekLow)}</span>
                  </div>
                )}
                {data.volume !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                    <span className="text-gray-900 dark:text-white">{formatVolume(data.volume)}</span>
                  </div>
                )}
                {data.averageVolume !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Avg Volume:</span>
                    <span className="text-gray-900 dark:text-white">{formatVolume(data.averageVolume)}</span>
                  </div>
                )}
                {data.currency !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                    <span className="text-gray-900 dark:text-white">{data.currency}</span>
                  </div>
                )}
                {data.exchange !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Exchange:</span>
                    <span className="text-gray-900 dark:text-white">{data.exchange}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Float & Short Interest */}
          {(data.float !== null || data.shortFloatShares !== null || data.pctFloatShort !== null || data.sharesOutstanding !== null) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Float & Short Interest</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {data.float !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Float:</span>
                    <span className="text-gray-900 dark:text-white">{formatShares(data.float)}</span>
                  </div>
                )}
                {data.shortFloatShares !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Short Float:</span>
                    <span className="text-gray-900 dark:text-white">{formatShares(data.shortFloatShares)}</span>
                  </div>
                )}
                {data.pctFloatShort !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">% Float Short:</span>
                    <span className="text-gray-900 dark:text-white">{formatPercent(data.pctFloatShort)}</span>
                  </div>
                )}
                {data.sharesOutstanding !== null && data.float === null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Shares Outstanding:</span>
                    <span className="text-gray-900 dark:text-white">{formatShares(data.sharesOutstanding)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Ownership */}
          {data.institutionalOwnership !== null && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ownership</h4>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Institutional Ownership:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {formatPercent(data.institutionalOwnership)}
                </span>
              </div>
            </div>
          )}

          {/* Section 4: Financials */}
          {(data.marketCap !== null || data.totalCash !== null || data.freeCashFlowTTM !== null || data.cashRunwayMonths !== null || (data.sharesOutstanding !== null && data.float !== null)) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Financials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {data.marketCap !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Market Cap:</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(data.marketCap)}</span>
                  </div>
                )}
                {data.totalCash !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Total Cash:</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(data.totalCash)}</span>
                  </div>
                )}
                {data.freeCashFlowTTM !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Free Cash Flow (TTM):</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(data.freeCashFlowTTM)}</span>
                  </div>
                )}
                {data.cashRunwayMonths !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Cash Runway:</span>
                    <span className="text-gray-900 dark:text-white">
                      {`${data.cashRunwayMonths.toFixed(1)} mo`}
                    </span>
                  </div>
                )}
                {data.sharesOutstanding !== null && data.float !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Shares Outstanding:</span>
                    <span className="text-gray-900 dark:text-white">{formatShares(data.sharesOutstanding)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Analyst Data */}
          {(data.targetHighPrice !== null || data.targetLowPrice !== null || data.targetMeanPrice !== null || data.recommendationMean !== null || data.numberOfAnalystOpinions !== null) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analyst Data</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {(data.targetLowPrice !== null || data.targetHighPrice !== null) && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Target Range:</span>
                    <span className="text-gray-900 dark:text-white break-words">
                      {formatRange(data.targetLowPrice, data.targetHighPrice)}
                    </span>
                  </div>
                )}
                {data.targetMeanPrice !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Target Mean:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.targetMeanPrice)}</span>
                  </div>
                )}
                {data.recommendationMean !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Recommendation:</span>
                    <span className="text-gray-900 dark:text-white break-words">
                      {formatRecommendation(data.recommendationMean)}
                    </span>
                  </div>
                )}
                {data.numberOfAnalystOpinions !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Analyst Opinions:</span>
                    <span className="text-gray-900 dark:text-white">{data.numberOfAnalystOpinions}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 6: Earnings Estimates */}
          {(data.earningsAverage !== null || data.earningsLow !== null || data.earningsHigh !== null || data.revenueAverage !== null || data.revenueLow !== null || data.revenueHigh !== null) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Earnings Estimates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {data.earningsAverage !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Earnings Avg:</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(data.earningsAverage)}</span>
                  </div>
                )}
                {(data.earningsLow !== null || data.earningsHigh !== null) && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Earnings Range:</span>
                    <span className="text-gray-900 dark:text-white break-words">
                      {formatRange(data.earningsLow, data.earningsHigh)}
                    </span>
                  </div>
                )}
                {data.revenueAverage !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Revenue Avg:</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(data.revenueAverage)}</span>
                  </div>
                )}
                {(data.revenueLow !== null || data.revenueHigh !== null) && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Revenue Range:</span>
                    <span className="text-gray-900 dark:text-white break-words">
                      {formatRange(data.revenueLow, data.revenueHigh)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 7: Company Info */}
          {(data.sector !== null || data.companyDescription !== null || (data.currency !== null && data.regularMarketPrice === null) || (data.exchange !== null && data.regularMarketPrice === null)) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company Info</h4>
              <div className="text-sm space-y-1">
                {data.sector !== null && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Sector:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{data.sector}</span>
                  </div>
                )}
                {data.companyDescription && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <p className="mt-1 text-gray-900 dark:text-white">{data.companyDescription}</p>
                  </div>
                )}
                {data.currency !== null && data.regularMarketPrice === null && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{data.currency}</span>
                  </div>
                )}
                {data.exchange !== null && data.regularMarketPrice === null && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Exchange:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{data.exchange}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 8: Other */}
          {(data.lastReverseSplitDate !== null || data.reverseSplitRatio !== null || data.dilutionYoY !== null || data.insiderTransactionData !== null) && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Other</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {data.lastReverseSplitDate !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Last Reverse Split:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(data.lastReverseSplitDate)}</span>
                  </div>
                )}
                {data.reverseSplitRatio !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Reverse Split Ratio:</span>
                    <span className="text-gray-900 dark:text-white">{data.reverseSplitRatio}</span>
                  </div>
                )}
                {data.dilutionYoY !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Dilution YoY:</span>
                    <span className="text-gray-900 dark:text-white">{formatPercent(data.dilutionYoY)}</span>
                  </div>
                )}
                {data.insiderTransactionData !== null && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">Insider Net (90d):</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatNumber(data.insiderTransactionData.netBuying)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

