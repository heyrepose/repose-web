"use client";

import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
import {
  SlidersHorizontal,
  Search as SearchIcon,
  X,
} from "lucide-react";
import type { ProductCardItem } from "@repose/api-types";
import { CONDITION_BADGE, type ListingConditionKey } from "@repose/ui";
import {
  apiFetchWithMeta,
  ApiError,
  apiFetch,
} from "@/lib/api-client";
import { ProductGrid } from "@/components/product/product-grid";
import { TrendingRail } from "@/components/product/recommendation-rails";
import {
  FilterDrawer,
  type FilterState,
} from "@/components/filters/filter-drawer";
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

type FacetBucket = { value: string; count: number };
type SearchFacets = {
  brand?: FacetBucket[];
  size?: FacetBucket[];
  condition?: FacetBucket[];
};

const FALLBACK_TRENDING = [
  "Leather",
  "Silk",
  "Blazer",
  "Loafers",
  "Burberry",
];

function conditionLabel(value: string): string {
  return (
    CONDITION_BADGE[value as ListingConditionKey]?.label ??
    value.replace(/_/g, " ")
  );
}

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const qParam = searchParams.get("q")?.trim() ?? "";
  // empty browse → newest; keyword search → relevance unless user set sort
  const sortParam =
    searchParams.get("sort") ?? (qParam ? "relevance" : "newest");
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
    setQ(qParam);
  }, [qParam]);

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
    staleTime: 5 * 60_000,
  });

  const { data: homeFeed } = useQuery({
    queryKey: ["feed", "home", "tags"],
    queryFn: () =>
      apiFetch<{ trendingTags?: string[] }>("/feed/home", {
        skipAuth: true,
      }),
    staleTime: 60_000,
  });

  const activeCategories = useMemo(
    () => (categories ?? []).filter((c) => c.slug !== "kids"),
    [categories],
  );

  const categoryName = (slug?: string) =>
    activeCategories.find((c) => c.slug === slug)?.name ?? slug;

  const queryString = useMemo(() => {
      const params = new URLSearchParams();
      if (qParam) params.set("q", qParam);
      if (sortParam) params.set("sort", sortParam);
    Object.entries(filtersFromUrl).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("limit", "24");
    return params.toString();
  }, [qParam, sortParam, filtersFromUrl]);

  const {
    data,
    isLoading,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["search", queryString],
    queryFn: ({ pageParam }) => {
      const qs = pageParam
        ? `${queryString}&cursor=${encodeURIComponent(pageParam)}`
        : queryString;
      return apiFetchWithMeta<ProductCardItem[]>(`/search?${qs}`, {
        skipAuth: true,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined,
    placeholderData: (prev) => prev,
  });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );
  const meta = data?.pages[0]?.meta;
  const facets = meta?.facets as SearchFacets | undefined;
  const resultCount = meta?.resultCount;

  const activeFilterCount = Object.values(filtersFromUrl).filter(
    Boolean,
  ).length;
  const hasQueryContext = Boolean(qParam) || activeFilterCount > 0;

  const showInitialSkeleton = isLoading && !data;
  const noResults =
    !isLoading &&
    !error &&
    items.length === 0 &&
    (hasQueryContext || resultCount === 0);

  function pushParams(next: {
    q?: string;
    sort?: string;
    filters?: FilterState;
  }) {
    const params = new URLSearchParams();
    const nextQ = (next.q !== undefined ? next.q : qParam).trim();
    const nextSort = next.sort ?? sortParam;
    const nextFilters = next.filters ?? filtersFromUrl;

    if (nextQ) params.set("q", nextQ);
    // Drop default sorts from the URL to keep links clean
    if (nextSort === "relevance" && nextQ) {
      // keep for clarity when searching
      params.set("sort", nextSort);
    } else if (nextSort === "newest" && !nextQ) {
      // default browse — omit
    } else if (nextSort) {
      params.set("sort", nextSort);
    }

    Object.entries(nextFilters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) trackRecentSearch(term);
    // New text search → relevance rank
    pushParams({
      q: term,
      sort: term ? "relevance" : "newest",
    });
  }

  function clearAll() {
    setQ("");
    pushParams({ q: "", sort: "newest", filters: {} });
  }

  const filterChips = useMemo(() => {
    const chips: Array<{ key: keyof FilterState; label: string }> = [];
    if (filtersFromUrl.category) {
      chips.push({
        key: "category",
        label: categoryName(filtersFromUrl.category) ?? filtersFromUrl.category,
      });
    }
    if (filtersFromUrl.condition) {
      chips.push({
        key: "condition",
        label: conditionLabel(filtersFromUrl.condition),
      });
    }
    if (filtersFromUrl.size) {
      chips.push({ key: "size", label: `Size ${filtersFromUrl.size}` });
    }
    if (filtersFromUrl.brand) {
      chips.push({ key: "brand", label: filtersFromUrl.brand });
    }
    if (filtersFromUrl.minPrice || filtersFromUrl.maxPrice) {
      const min = filtersFromUrl.minPrice ?? "0";
      const max = filtersFromUrl.maxPrice ?? "∞";
      chips.push({
        key: filtersFromUrl.minPrice ? "minPrice" : "maxPrice",
        label: `AED ${min}–${max}`,
      });
    }
    return chips;
  }, [filtersFromUrl, activeCategories]);

  const trending =
    homeFeed?.trendingTags?.length ? homeFeed.trendingTags : FALLBACK_TRENDING;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Explore</h1>
        {typeof resultCount === "number" && !showInitialSkeleton ? (
          <span className="text-sm text-muted tabular-nums">
            {resultCount} {resultCount === 1 ? "result" : "results"}
          </span>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Brand, style, keyword…"
            className="h-12 w-full rounded-pill border border-card-border bg-surface pl-10 pr-10 text-sm outline-none focus:border-primary"
            enterKeyHint="search"
            autoComplete="off"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-accent-soft hover:text-text"
              onClick={() => {
                setQ("");
                if (qParam) pushParams({ q: "", sort: "newest" });
              }}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <Button type="submit" className="shrink-0 px-5">
          Search
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
                  className="min-h-[44px] text-xs text-muted underline"
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
                      trackRecentSearch(tag);
                      pushParams({ q: tag, sort: "relevance" });
                    }}
                    className="min-h-[44px] rounded-pill border border-card-border bg-surface px-3 py-2 text-sm font-medium"
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
                    pushParams({ q: tag, sort: "relevance" });
                  }}
                  className="min-h-[44px] rounded-pill bg-accent-soft px-3 py-2 text-sm font-medium text-primary"
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
        <div className="min-w-[150px] flex-1 sm:flex-none">
          <Select
            value={sortParam}
            onChange={(e) => pushParams({ sort: e.target.value })}
            options={[
              { value: "relevance", label: "Relevance" },
              { value: "newest", label: "Newest" },
              { value: "price_asc", label: "Price: low to high" },
              { value: "price_desc", label: "Price: high to low" },
            ]}
          />
        </div>
        {hasQueryContext ? (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto min-h-[44px] text-sm font-medium text-primary underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {filterChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={cn(
                "inline-flex min-h-[44px] items-center gap-1 rounded-pill bg-accent-soft px-3 py-1.5 text-xs font-medium text-primary",
              )}
              onClick={() => {
                if (chip.key === "minPrice" || chip.key === "maxPrice") {
                  pushParams({
                    filters: {
                      ...filtersFromUrl,
                      minPrice: undefined,
                      maxPrice: undefined,
                    },
                  });
                  return;
                }
                pushParams({
                  filters: { ...filtersFromUrl, [chip.key]: undefined },
                });
              }}
            >
              {chip.label}
              <X className="h-3 w-3" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}

      {showInitialSkeleton ? (
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
                ? `Nothing for “${qParam}”. Try another term or clear filters.`
                : "No listings match these filters."}
            </p>
            <Button className="mt-4" variant="outline" onClick={clearAll}>
              Clear search
            </Button>
          </div>
          <TrendingRail title="Trending instead" />
        </div>
      ) : (
        <>
          <div
            className={cn(
              "transition-opacity",
              isFetching && !isFetchingNextPage ? "opacity-70" : "opacity-100",
            )}
          >
        <ProductGrid
              items={items}
              emptyTitle="No matches"
              emptyMessage="Try a search or open filters to browse."
            />
          </div>
          {hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filtersFromUrl}
        onApply={(filters) => pushParams({ filters })}
        categories={activeCategories}
        facets={facets}
      />
    </div>
  );
}

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
