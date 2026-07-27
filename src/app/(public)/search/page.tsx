"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, FormEvent } from "react";
import { SlidersHorizontal, Search as SearchIcon } from "lucide-react";
import type { ProductCardItem } from "@repose/api-types";
import { apiFetchWithMeta, ApiError, apiFetch } from "@/lib/api-client";
import { ProductGrid } from "@/components/product/product-grid";
import { TrendingRail } from "@/components/product/recommendation-rails";
import { FilterDrawer, type FilterState } from "@/components/filters/filter-drawer";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  clearRecentSearches,
  getRecentSearches,
  trackRecentSearch,
} from "@/lib/history";

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const qParam = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort") ?? "relevance";
  const categoryParam = searchParams.get("category") ?? undefined;
  const brandParam = searchParams.get("brand") ?? undefined;
  const sizeParam = searchParams.get("size") ?? undefined;
  const minPriceParam = searchParams.get("minPrice") ?? undefined;
  const maxPriceParam = searchParams.get("maxPrice") ?? undefined;
  const conditionParam = searchParams.get("condition") ?? undefined;

  const filtersFromUrl: FilterState = useMemo(
    () => ({
      category: categoryParam,
      brand: brandParam,
      size: sizeParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      condition: conditionParam,
    }),
    [
      categoryParam,
      brandParam,
      sizeParam,
      minPriceParam,
      maxPriceParam,
      conditionParam,
    ],
  );

  const [q, setQ] = useState(qParam);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, [qParam]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      apiFetch<Array<{ id: string; name: string; slug: string }>>(
        "/categories",
        { skipAuth: true },
      ),
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (qParam) params.set("q", qParam);
    if (sortParam) params.set("sort", sortParam);
    Object.entries(filtersFromUrl).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("limit", "40");
    return params.toString();
  }, [qParam, sortParam, filtersFromUrl]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["search", queryString],
    queryFn: () =>
      apiFetchWithMeta<ProductCardItem[]>(`/search?${queryString}`, {
        skipAuth: true,
      }),
  });

  const activeFilterCount = Object.values(filtersFromUrl).filter(Boolean).length;
  const noResults =
    !isLoading &&
    !isFetching &&
    !error &&
    (data?.data?.length ?? 0) === 0 &&
    (Boolean(qParam) || activeFilterCount > 0);

  function pushParams(next: {
    q?: string;
    sort?: string;
    filters?: FilterState;
  }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? qParam;
    const nextSort = next.sort ?? sortParam;
    const nextFilters = next.filters ?? filtersFromUrl;
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextSort) params.set("sort", nextSort);
    Object.entries(nextFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/search?${params.toString()}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) trackRecentSearch(q.trim());
    pushParams({ q });
  }

  const trending = ["90s Denim", "Silk Scarves", "Tailored", "Linen", "Bags"];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Search</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Brand, style, keyword…"
            className="h-12 w-full rounded-pill border border-card-border bg-surface pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Button type="submit" className="shrink-0 px-5">
          Go
        </Button>
      </form>

      {!qParam && activeFilterCount === 0 ? (
        <>
          {recent.length ? (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted">Recent</h2>
                <button
                  type="button"
                  className="text-xs text-muted underline"
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setQ(tag);
                      pushParams({ q: tag });
                    }}
                    className="rounded-pill border border-card-border bg-surface px-3 py-2 text-sm font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted">Trending</h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setQ(tag);
                    trackRecentSearch(tag);
                    pushParams({ q: tag });
                  }}
                  className="rounded-pill bg-accent-soft px-3 py-2 text-sm font-medium text-primary"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] text-surface">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
        <div className="min-w-[140px] flex-1 sm:flex-none">
          <Select
            value={sortParam}
            onChange={(e) => pushParams({ sort: e.target.value })}
            options={[
              { value: "relevance", label: "Relevance" },
              { value: "newest", label: "Newest" },
              { value: "price_asc", label: "Price ↑" },
              { value: "price_desc", label: "Price ↓" },
            ]}
          />
        </div>
        {data?.meta?.resultCount != null ? (
          <span className="ml-auto text-sm text-muted">
            {data.meta.resultCount} results
          </span>
        ) : null}
      </div>

      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filtersFromUrl).map(([key, val]) =>
            val ? (
              <button
                key={key}
                type="button"
                className={cn(
                  "rounded-pill bg-accent-soft px-3 py-1.5 text-xs font-medium text-primary",
                )}
                onClick={() =>
                  pushParams({
                    filters: { ...filtersFromUrl, [key]: undefined },
                  })
                }
              >
                {key}: {val} ×
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      {isLoading || isFetching ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-card border border-card-border bg-surface p-4 text-sm text-muted">
          {error instanceof ApiError
            ? error.message
            : "Search failed. Is the API running?"}
        </p>
      ) : noResults ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-card-border bg-surface p-6 text-center">
            <p className="font-semibold">No matches</p>
            <p className="mt-1 text-sm text-muted">
              {qParam
                ? `Nothing for “${qParam}”. Clear filters or try another term.`
                : "Try clearing filters."}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setQ("");
                pushParams({ q: "", filters: {} });
              }}
            >
              Clear filters
            </Button>
          </div>
          <TrendingRail title="Trending instead" />
        </div>
      ) : (
        <ProductGrid
          items={data?.data ?? []}
          emptyTitle="No matches"
          emptyMessage="Try a search or open filters to browse."
        />
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filtersFromUrl}
        onApply={(filters) => pushParams({ filters })}
        categories={(categories ?? []).filter((c) => c.slug !== "kids")}
        facets={data?.meta?.facets as FilterDrawerFacets | undefined}
      />
    </div>
  );
}

type FilterDrawerFacets = {
  brand?: Array<{ value: string; count: number }>;
  size?: Array<{ value: string; count: number }>;
  condition?: Array<{ value: string; count: number }>;
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
