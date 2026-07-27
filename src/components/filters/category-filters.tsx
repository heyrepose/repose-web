"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { apiFetch, apiFetchWithMeta } from "@/lib/api-client";
import { FilterDrawer, type FilterState } from "@/components/filters/filter-drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTER_PILLS = [
  { label: "Newest", sort: "newest" },
  { label: "Price ↑", sort: "price_asc" },
  { label: "Price ↓", sort: "price_desc" },
];

export function CategoryFilters({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "newest";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtersFromUrl: FilterState = useMemo(
    () => ({
      category: slug,
      brand: searchParams.get("brand") ?? undefined,
      size: searchParams.get("size") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      condition: searchParams.get("condition") ?? undefined,
    }),
    [slug, searchParams],
  );

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      apiFetch<Array<{ id: string; name: string; slug: string }>>(
        "/categories",
        { skipAuth: true },
      ),
  });

  const { data: searchMeta } = useQuery({
    queryKey: ["category-facets", slug],
    queryFn: () =>
      apiFetchWithMeta<unknown[]>(
        `/search?category=${encodeURIComponent(slug)}&limit=1`,
        { skipAuth: true },
      ),
  });

  function push(next: { sort?: string; filters?: FilterState }) {
    const params = new URLSearchParams();
    const nextSort = next.sort ?? sort;
    const nextFilters = next.filters ?? filtersFromUrl;
    if (nextSort) params.set("sort", nextSort);
    Object.entries(nextFilters).forEach(([k, v]) => {
      if (k === "category") return;
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    router.push(`/category/${slug}${qs ? `?${qs}` : ""}`);
  }

  const activeExtra = Object.entries(filtersFromUrl).filter(
    ([k, v]) => k !== "category" && Boolean(v),
  ).length;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.sort}
            type="button"
            onClick={() => push({ sort: pill.sort })}
            className={
              sort === pill.sort
                ? "shrink-0 rounded-pill bg-primary px-4 py-2 text-sm font-medium text-surface"
                : "shrink-0 rounded-pill bg-accent-soft px-4 py-2 text-sm font-medium text-muted"
            }
          >
            {pill.label}
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("shrink-0 gap-2")}
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeExtra > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] text-surface">
              {activeExtra}
            </span>
          ) : null}
        </Button>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filtersFromUrl}
        onApply={(filters) => push({ filters: { ...filters, category: slug } })}
        categories={(categories ?? []).filter((c) => c.slug !== "kids")}
        facets={
          searchMeta?.meta?.facets as
            | {
                brand?: Array<{ value: string; count: number }>;
                size?: Array<{ value: string; count: number }>;
                condition?: Array<{ value: string; count: number }>;
              }
            | undefined
        }
      />
    </>
  );
}
