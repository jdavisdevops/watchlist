"use client";

import { useState, useEffect, useRef } from "react";
import { TickerData, TickerApiResponse } from "@/lib/tickerData";
import { getWatchlist, addTicker, removeTicker } from "@/lib/storage";
import TickerInput from "./components/TickerInput";
import TickerList, { TickerListRef } from "./components/TickerList";

export default function Home() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [tickerData, setTickerData] = useState<Map<string, TickerData>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTickers, setLoadingTickers] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const tickerListRef = useRef<TickerListRef>(null);

  // Load tickers from localStorage on mount
  useEffect(() => {
    const savedTickers = getWatchlist();
    setTickers(savedTickers);
  }, []);

  // Reset allExpanded state when tickers change
  useEffect(() => {
    setAllExpanded(false);
  }, [tickers.length]);

  // Fetch data for all tickers
  useEffect(() => {
    if (tickers.length === 0) {
      setTickerData(new Map());
      return;
    }

    const fetchAllTickers = async () => {
      setLoading(true);
      const newData = new Map<string, TickerData>();
      const newErrors = new Map<string, string>();
      const loadingSet = new Set<string>();

      for (const ticker of tickers) {
        loadingSet.add(ticker);
        setLoadingTickers(new Set(loadingSet));

        try {
          const response = await fetch(`/api/ticker/${ticker}`);
          const result: TickerApiResponse = await response.json();

          if (result.success && result.data) {
            newData.set(ticker, result.data);
            newErrors.delete(ticker);
          } else {
            newErrors.set(ticker, result.error || "Failed to fetch data");
          }
        } catch (error) {
          newErrors.set(ticker, error instanceof Error ? error.message : "Unknown error");
        } finally {
          loadingSet.delete(ticker);
          setLoadingTickers(new Set(loadingSet));
        }
      }

      setTickerData(newData);
      setErrors(newErrors);
      setLoading(false);
    };

    fetchAllTickers();
  }, [tickers]);

  const handleAddTicker = async (symbol: string) => {
    // Check if already exists
    if (tickers.includes(symbol.toUpperCase())) {
      throw new Error("Ticker already in watchlist");
    }

    // Add to list
    const updated = addTicker(symbol);
    setTickers(updated);

    // Fetch data for new ticker
    setLoadingTickers((prev) => new Set(prev).add(symbol));
    try {
      const response = await fetch(`/api/ticker/${symbol}`);
      const result: TickerApiResponse = await response.json();

      if (result.success && result.data) {
        setTickerData((prev) => {
          const next = new Map(prev);
          next.set(symbol, result.data!);
          return next;
        });
        setErrors((prev) => {
          const next = new Map(prev);
          next.delete(symbol);
          return next;
        });
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (error) {
      setErrors((prev) => {
        const next = new Map(prev);
        next.set(symbol, error instanceof Error ? error.message : "Unknown error");
        return next;
      });
      // Remove ticker if fetch failed
      const updated = removeTicker(symbol);
      setTickers(updated);
      throw error;
    } finally {
      setLoadingTickers((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    }
  };

  const handleRemoveTicker = (symbol: string) => {
    const updated = removeTicker(symbol);
    setTickers(updated);
    setTickerData((prev) => {
      const next = new Map(prev);
      next.delete(symbol);
      return next;
    });
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(symbol);
      return next;
    });
  };

  const dataArray = Array.from(tickerData.values());

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Stock Watchlist</h1>
          <p className="text-gray-600 dark:text-gray-400">Research and track your stock tickers</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Ticker</h2>
          <TickerInput onAdd={handleAddTicker} isLoading={loading} />
        </div>

        {errors.size > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Errors:</h3>
            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400">
              {Array.from(errors.entries()).map(([ticker, error]) => (
                <li key={ticker}>
                  <strong>{ticker}</strong>: {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Watchlist</h2>
                {tickers.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {tickers.length} ticker{tickers.length !== 1 ? "s" : ""} in watchlist
                  </p>
                )}
              </div>
              {tickers.length > 0 && (
                <div className="flex-1 flex justify-center">
                  <button
                    onClick={() => {
                      if (tickerListRef.current) {
                        if (allExpanded) {
                          tickerListRef.current.collapseAll();
                          setAllExpanded(false);
                        } else {
                          tickerListRef.current.expandAll();
                          setAllExpanded(true);
                        }
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    {allExpanded ? "Collapse All" : "Expand All"}
                  </button>
                </div>
              )}
              <div className="flex-1"></div>
            </div>
          </div>
          <div className="p-6">
            {loading && dataArray.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Loading ticker data...</p>
              </div>
            ) : (
              <TickerList
                ref={tickerListRef}
                data={dataArray}
                onRemove={handleRemoveTicker}
                isLoading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

