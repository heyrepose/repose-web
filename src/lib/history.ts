"use client";

const RECENT_VIEWS_KEY = "repose_recently_viewed";
const RECENT_SEARCHES_KEY = "repose_recent_searches";
const MAX_VIEWS = 12;
const MAX_SEARCHES = 8;

export type RecentViewItem = {
  id: string;
  title: string | null;
  priceAed: string | null;
  condition: string | null;
  mainImageUrl: string | null;
  isFeatured?: boolean;
  status?: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function getRecentlyViewed(): RecentViewItem[] {
  return readJson<RecentViewItem[]>(RECENT_VIEWS_KEY, []);
}

export function trackRecentlyViewed(item: RecentViewItem) {
  const prev = getRecentlyViewed().filter((x) => x.id !== item.id);
  writeJson(RECENT_VIEWS_KEY, [item, ...prev].slice(0, MAX_VIEWS));
}

export function clearRecentlyViewed() {
  writeJson(RECENT_VIEWS_KEY, []);
}

export function getRecentSearches(): string[] {
  return readJson<string[]>(RECENT_SEARCHES_KEY, []);
}

export function trackRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const prev = getRecentSearches().filter(
    (x) => x.toLowerCase() !== trimmed.toLowerCase(),
  );
  writeJson(RECENT_SEARCHES_KEY, [trimmed, ...prev].slice(0, MAX_SEARCHES));
}

export function clearRecentSearches() {
  writeJson(RECENT_SEARCHES_KEY, []);
}
