import { WatchlistStorage } from "./tickerData";

const STORAGE_KEY = "watchlist_tickers";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const data: WatchlistStorage = JSON.parse(stored);
    return data.tickers || [];
  } catch (error) {
    console.error("Error reading watchlist from localStorage:", error);
    return [];
  }
}

export function saveWatchlist(tickers: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const data: WatchlistStorage = {
      tickers: tickers.map((t) => t.toUpperCase().trim()).filter((t) => t.length > 0),
      lastSync: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving watchlist to localStorage:", error);
  }
}

export function addTicker(symbol: string): string[] {
  const current = getWatchlist();
  const upperSymbol = symbol.toUpperCase().trim();
  if (upperSymbol && !current.includes(upperSymbol)) {
    const updated = [...current, upperSymbol];
    saveWatchlist(updated);
    return updated;
  }
  return current;
}

export function removeTicker(symbol: string): string[] {
  const current = getWatchlist();
  const upperSymbol = symbol.toUpperCase().trim();
  const updated = current.filter((t) => t !== upperSymbol);
  saveWatchlist(updated);
  return updated;
}

