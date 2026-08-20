"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { getApiBaseUrl } from "@/lib/api-client";
import { useCartCount } from "@/lib/cart";
import { trackRecentSearch } from "@/lib/history";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  title: string | null;
  priceAed: string | null;
  mainImageUrl: string | null;
};

export function TopAppBar() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const cartCount = useCartCount();

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "count"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${getApiBaseUrl()}/notifications?limit=30`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return 0;
      const json = (await res.json()) as {
        data: Array<{ isRead?: boolean; readAt?: string | null }>;
        meta?: { unreadCount?: number };
      };
      if (typeof json.meta?.unreadCount === "number") {
        return json.meta.unreadCount;
      }
      return (json.data ?? []).filter((n) => !(n.isRead || n.readAt)).length;
    },
    refetchInterval: 60_000,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["search", "suggest", debounced],
    enabled: debounced.length >= 2 && open,
    queryFn: async () => {
      const res = await fetch(
        `${getApiBaseUrl()}/search?q=${encodeURIComponent(debounced)}&limit=5`,
      );
      if (!res.ok) return [] as Suggestion[];
      const json = (await res.json()) as { data: Suggestion[] };
      return json.data ?? [];
    },
  });

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query) trackRecentSearch(query);
    setOpen(false);
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 lg:px-8 py-3">
        <Link
          href="/"
          className="shrink-0 font-brand text-[1.65rem] leading-none text-primary"
        >
          Repose
        </Link>

        <div ref={wrapRef} className="relative hidden flex-1 sm:block">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search fashion…"
              className="h-11 w-full rounded-pill border border-card-border bg-surface pl-10 pr-3 text-sm outline-none focus:border-primary"
            />
          </form>
          {open && debounced.length >= 2 ? (
            <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-card border border-card-border bg-surface shadow-card">
              {suggestions.length ? (
                suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/listing/${s.id}`}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent-soft/50"
                      onClick={() => {
                        trackRecentSearch(debounced);
                        setOpen(false);
                      }}
                    >
                      <span className="line-clamp-1 flex-1 font-medium">
                        {s.title ?? "Listing"}
                      </span>
                      {s.priceAed ? (
                        <span className="text-xs text-muted">
                          AED {s.priceAed}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-3 py-3 text-sm text-muted">No matches</li>
              )}
              <li>
                <button
                  type="button"
                  className="w-full border-t border-card-border px-3 py-2 text-left text-sm text-primary"
                  onClick={() => {
                    trackRecentSearch(debounced);
                    setOpen(false);
                    router.push(`/search?q=${encodeURIComponent(debounced)}`);
                  }}
                >
                  Search for “{debounced}”
                </button>
              </li>
            </ul>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            className="flex h-11 w-11 items-center justify-center rounded-full text-primary sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/cart"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-primary"
                aria-label="Bag"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span
                    className={cn(
                      "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-surface",
                    )}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-primary"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </Link>
              <Link
                href="/profile"
                className="flex h-11 w-11 items-center justify-center rounded-full text-primary"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-pill bg-primary px-4 py-2 text-sm font-medium text-surface"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
