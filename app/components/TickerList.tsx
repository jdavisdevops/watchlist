"use client";

import { useState, useMemo } from "react";
import { TickerData } from "@/lib/tickerData";
import TickerCard from "./TickerCard";

interface TickerListProps {
  data: TickerData[];
  onRemove: (symbol: string) => void;
  isLoading?: boolean;
}

type SortKey = keyof TickerData | null;
type SortDirection = "asc" | "desc" | null;

export default function TickerList({ data, onRemove, isLoading = false }: TickerListProps) {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: keyof TickerData) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const getSortIcon = (key: keyof TickerData) => {
    if (sortKey !== key) {
      return "↕️";
    }
    return sortDirection === "asc" ? "↑" : "↓";
  };

  if (data.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No tickers in watchlist</p>
        <p className="text-sm mt-2">Add a ticker above to get started</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Controls */}
      {data.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Sort by:</span>
          <button
            onClick={() => handleSort("ticker")}
            className={`px-3 py-1 text-sm rounded ${
              sortKey === "ticker"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ticker {getSortIcon("ticker")}
          </button>
          <button
            onClick={() => handleSort("marketCap")}
            className={`px-3 py-1 text-sm rounded ${
              sortKey === "marketCap"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Market Cap {getSortIcon("marketCap")}
          </button>
          <button
            onClick={() => handleSort("pctFloatShort")}
            className={`px-3 py-1 text-sm rounded ${
              sortKey === "pctFloatShort"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Short % {getSortIcon("pctFloatShort")}
          </button>
          <button
            onClick={() => handleSort("sector")}
            className={`px-3 py-1 text-sm rounded ${
              sortKey === "sector"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Sector {getSortIcon("sector")}
          </button>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {sortedData.map((ticker) => (
          <TickerCard key={ticker.ticker} data={ticker} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

