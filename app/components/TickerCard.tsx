"use client";

import { useState } from "react";
import { TickerData } from "@/lib/tickerData";
import FlagBadge from "./FlagBadge";

interface TickerCardProps {
  data: TickerData;
  onRemove: (symbol: string) => void;
}

export default function TickerCard({ data, onRemove }: TickerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header - Always Visible */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900">{data.ticker}</h3>
            {data.sector && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {data.sector}
              </span>
            )}
          </div>
          <button
            onClick={() => onRemove(data.ticker)}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Remove
          </button>
        </div>

        {/* Key Metrics - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 text-xs mb-0.5">Market Cap</span>
            <span className="font-semibold text-gray-900 truncate">
              {formatNumber(data.marketCap)}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 text-xs mb-0.5">Float</span>
            <span className="font-semibold text-gray-900 truncate">
              {formatNumber(data.float)}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 text-xs mb-0.5">Short %</span>
            <span
              className={`font-semibold truncate ${
                data.pctFloatShort && data.pctFloatShort > 0.2
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {formatPercent(data.pctFloatShort)}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-500 text-xs mb-0.5">Inst. Own</span>
            <span className="font-semibold text-gray-900 truncate">
              {formatPercent(data.institutionalOwnership)}
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
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
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
          {/* Float & Short Interest */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Float & Short Interest</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Float:</span>
                <span className="ml-2 text-gray-900">{formatNumber(data.float)}</span>
              </div>
              <div>
                <span className="text-gray-600">Short Float:</span>
                <span className="ml-2 text-gray-900">{formatNumber(data.shortFloatShares)}</span>
              </div>
              <div>
                <span className="text-gray-600">% Float Short:</span>
                <span className="ml-2 text-gray-900">{formatPercent(data.pctFloatShort)}</span>
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Ownership</h4>
            <div className="text-sm">
              <span className="text-gray-600">Institutional Ownership:</span>
              <span className="ml-2 text-gray-900">
                {formatPercent(data.institutionalOwnership)}
              </span>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Financials</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Market Cap:</span>
                <span className="ml-2 text-gray-900">{formatNumber(data.marketCap)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Cash:</span>
                <span className="ml-2 text-gray-900">{formatNumber(data.totalCash)}</span>
              </div>
              <div>
                <span className="text-gray-600">Free Cash Flow (TTM):</span>
                <span className="ml-2 text-gray-900">{formatNumber(data.freeCashFlowTTM)}</span>
              </div>
              <div>
                <span className="text-gray-600">Cash Runway:</span>
                <span className="ml-2 text-gray-900">
                  {data.cashRunwayMonths !== null
                    ? `${data.cashRunwayMonths.toFixed(1)} mo`
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Shares Outstanding:</span>
                <span className="ml-2 text-gray-900">{formatNumber(data.sharesOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Company Info</h4>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-600">Sector:</span>
                <span className="ml-2 text-gray-900">{data.sector || "-"}</span>
              </div>
              {data.companyDescription && (
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1 text-gray-900">{data.companyDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Other */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Other</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Last Reverse Split:</span>
                <span className="ml-2 text-gray-900">{formatDate(data.lastReverseSplitDate)}</span>
              </div>
              <div>
                <span className="text-gray-600">Reverse Split Ratio:</span>
                <span className="ml-2 text-gray-900">{data.reverseSplitRatio || "-"}</span>
              </div>
              <div>
                <span className="text-gray-600">Dilution YoY:</span>
                <span className="ml-2 text-gray-900">{formatPercent(data.dilutionYoY)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

