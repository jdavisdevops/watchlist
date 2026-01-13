"use client";

import { useState } from "react";

interface TickerInputProps {
  onAdd: (symbol: string) => Promise<void>;
  isLoading?: boolean;
}

export default function TickerInput({ onAdd, isLoading = false }: TickerInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addingTickers, setAddingTickers] = useState<Set<string>>(new Set());

  const parseTickers = (input: string): string[] => {
    return input
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);
  };

  const validateTicker = (symbol: string): string | null => {
    if (!symbol) {
      return "Ticker symbol cannot be empty";
    }
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      return `Invalid ticker symbol format: ${symbol}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      setError("Please enter a ticker symbol");
      return;
    }

    // Parse comma-separated tickers
    const tickers = parseTickers(trimmedInput);
    
    if (tickers.length === 0) {
      setError("Please enter at least one valid ticker symbol");
      return;
    }

    // Validate all tickers
    const validationErrors: string[] = [];
    for (const ticker of tickers) {
      const error = validateTicker(ticker);
      if (error) {
        validationErrors.push(error);
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join("; "));
      return;
    }

    setError(null);
    setInput("");
    setAddingTickers(new Set(tickers));

    // Add tickers one by one
    const errors: string[] = [];
    for (const ticker of tickers) {
      try {
        await onAdd(ticker);
      } catch (err) {
        errors.push(`${ticker}: ${err instanceof Error ? err.message : "Failed to add"}`);
      }
    }

    setAddingTickers(new Set());

    if (errors.length > 0) {
      setError(errors.join("; "));
    }
  };

  const isAdding = isLoading || addingTickers.size > 0;
  const displayText =
    addingTickers.size > 0
      ? `Adding ${addingTickers.size} ticker${addingTickers.size !== 1 ? "s" : ""}...`
      : isLoading
      ? "Adding..."
      : "Add";

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <div className="flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Enter ticker(s) - single: AAPL or multiple: AAPL, MSFT, TSLA"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          disabled={isAdding}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {addingTickers.size > 0 && (
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            Adding: {Array.from(addingTickers).join(", ")}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isAdding}
        className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {displayText}
      </button>
    </form>
  );
}

