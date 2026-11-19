"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MapPin, Search, ShoppingBag, User } from "lucide-react";
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
  const headerRef = useRef<HTMLElement>(null);
  const cartCount = useCartCount();

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => {
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${el.offsetHeight}px`,
      );
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, []);

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
    <header ref={headerRef} className="sticky top-0 z-40 w-full bg-bg font-sans">
      {/* 1. Top Announcement Bar */}
      <div className="bg-primary px-4 h-7 flex items-center justify-center text-center text-[10px] font-normal tracking-wide text-white md:text-[11px]">
        Free shipping on orders over 200 AED · Authenticated in Dubai · New arrivals daily
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-4 py-1.5 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="shrink-0 font-brand text-2xl md:text-3xl leading-none text-primary"
        >
          Repose
        </Link>

        {/* Search Input Box */}
        <div ref={wrapRef} className="relative flex-1 max-w-3xl mx-3 md:mx-6 hidden sm:block">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by brand, article, or category…"
              className="h-8 w-full rounded-md border border-card-border/80 bg-surface pl-9 pr-3 text-xs md:text-sm text-text placeholder:text-muted/80 outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
            />
          </form>

          {/* Search Suggestions Dropdown */}
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

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Link
            href="/search"
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary sm:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Sell an item button */}
          <Link
            href="/sell"
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-surface hover:bg-primary/90 transition-colors shadow-sm"
          >
            Sell an item
          </Link>

          {/* Auth links or Profile */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link
                href="/notifications"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-text hover:bg-accent-soft/40"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </Link>
              <Link
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text hover:bg-accent-soft/40"
                aria-label="Profile"
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs font-medium text-text">
              <Link href="/login" className="hover:opacity-80">
                Sign in
              </Link>
              <Link href="/signup" className="underline underline-offset-4 hover:opacity-80">
                Sign up
              </Link>
            </div>
          )}

          {/* Cart Bag Icon with badge */}
          <Link
            href="/cart"
            className="relative flex h-8 w-8 items-center justify-center text-text hover:opacity-80"
            aria-label="Bag"
          >
            <ShoppingBag className="h-4 w-4 stroke-[1.75]" />
            <span
              className={cn(
                "absolute -top-0.5 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#9dc462] px-1 text-[9px] font-bold text-primary shadow-sm",
              )}
            >
              {cartCount > 0 ? (cartCount > 9 ? "9+" : cartCount) : "2"}
            </span>
          </Link>
        </div>
      </div>

      {/* 3. Sub-header / Category Navigation Bar */}
      <div className="border-t border-b border-card-border/60 bg-[#e7ded0]/60">
        <div className="relative mx-auto flex max-w-[1440px] h-9 items-center justify-center px-4 lg:px-8 text-[11px] md:text-xs font-medium">
          {/* Location tag */}
          <div className="absolute left-4 lg:left-8 hidden md:flex items-center gap-1 text-text/80 font-semibold tracking-wide uppercase shrink-0">
            <MapPin className="h-3 w-3 text-primary fill-primary/20" />
            <span>DUBAI - BUSINESS BAY</span>
          </div>

          {/* Category nav links */}
          <div className="flex items-center justify-center gap-5 md:gap-8 overflow-x-auto no-scrollbar">
            <Link
              href="/search?filter=new-arrivals"
              className="shrink-0 text-[#d43827] font-semibold hover:opacity-80 transition-opacity"
            >
              New Arrivals
            </Link>
            <Link
              href="/category/designers"
              className="shrink-0 text-text/80 hover:text-text transition-colors"
            >
              Designers
            </Link>
            <Link
              href="/category/women"
              className="shrink-0 text-text/80 hover:text-text transition-colors"
            >
              Women
            </Link>
            <Link
              href="/category/men"
              className="shrink-0 text-text/80 hover:text-text transition-colors"
            >
              Men
            </Link>
            <Link
              href="/category/bags"
              className="shrink-0 text-text/80 hover:text-text transition-colors"
            >
              Bags
            </Link>
            <Link
              href="/category/accessories"
              className="shrink-0 text-text/80 hover:text-text transition-colors"
            >
              Accessories
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

