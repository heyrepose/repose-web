"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ListingCondition } from "@repose/api-types";
import { CONDITION_BADGE, type ListingConditionKey } from "@repose/ui";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FilterState = {
  category?: string;
  brand?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
};

type FacetBucket = { value: string; count: number };

type Props = {
  open: boolean;
  onClose: () => void;
  value: FilterState;
  onApply: (next: FilterState) => void;
  categories?: Array<{ slug: string; name: string }>;
  facets?: {
    brand?: FacetBucket[];
    size?: FacetBucket[];
    condition?: FacetBucket[];
  };
  /** When true, category chips are locked (e.g. category page). */
  lockCategory?: boolean;
};

const CONDITIONS = Object.keys(CONDITION_BADGE) as ListingCondition[];

const FALLBACK_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "One size",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "48",
];

function Pill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-surface"
          : "border border-card-border bg-surface text-muted",
      )}
    >
      <span>{children}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "text-xs tabular-nums",
            active ? "text-surface/80" : "text-muted",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function FilterDrawer({
  open,
  onClose,
  value,
  onApply,
  categories = [],
  facets,
  lockCategory = false,
}: Props) {
  const [draft, setDraft] = useState<FilterState>(value);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setPriceError(null);
    }
  }, [open, value]);

  function reset() {
    setDraft(lockCategory ? { category: value.category } : {});
    setPriceError(null);
  }

  function apply() {
    const min = draft.minPrice?.trim();
    const max = draft.maxPrice?.trim();
    if (min && Number.isNaN(Number(min))) {
      setPriceError("Min price must be a number");
      return;
    }
    if (max && Number.isNaN(Number(max))) {
      setPriceError("Max price must be a number");
      return;
    }
    if (min && max && Number(min) > Number(max)) {
      setPriceError("Min price cannot be greater than max");
      return;
    }
    setPriceError(null);
    onApply({
      ...draft,
      minPrice: min || undefined,
      maxPrice: max || undefined,
      brand: draft.brand?.trim() || undefined,
    });
    onClose();
  }

  const brandFacets = facets?.brand ?? [];
  const sizeFacets = facets?.size ?? [];

  // Prefer live facet sizes so options match the catalog; fall back when empty.
  const sizeOptions: Array<{ value: string; count?: number }> = (() => {
    const base: Array<{ value: string; count?: number }> =
      sizeFacets.length > 0
        ? sizeFacets.map((s) => ({ value: s.value, count: s.count }))
        : FALLBACK_SIZES.map((value) => ({ value }));
    if (draft.size && !base.some((s) => s.value === draft.size)) {
      return [{ value: draft.size }, ...base];
    }
    return base;
  })();

  const brandSelectedFromFacet = brandFacets.some(
    (b) => b.value === draft.brand,
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={reset}>
            Reset
          </Button>
          <Button className="flex-1" onClick={apply}>
            Apply
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {categories.length > 0 && !lockCategory ? (
          <section>
            <h3 className="mb-3 text-sm font-semibold">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Pill
                  key={c.slug}
                  active={draft.category === c.slug}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      category: d.category === c.slug ? undefined : c.slug,
                    }))
                  }
                >
                  {c.name}
                </Pill>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="mb-3 text-sm font-semibold">Condition</h3>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => {
              const label =
                CONDITION_BADGE[c as ListingConditionKey]?.label ?? c;
              const facetCount = facets?.condition?.find(
                (f) => f.value === c,
              )?.count;
              return (
                <Pill
                  key={c}
                  active={draft.condition === c}
                  count={facetCount}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      condition: d.condition === c ? undefined : c,
                    }))
                  }
                >
                  {label}
                </Pill>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((s) => (
              <Pill
                key={s.value}
                active={draft.size === s.value}
                count={s.count}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    size: d.size === s.value ? undefined : s.value,
                  }))
                }
              >
                {s.value}
              </Pill>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Brand</h3>
          {brandFacets.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {brandFacets.slice(0, 24).map((b) => (
                <Pill
                  key={b.value}
                  active={draft.brand === b.value}
                  count={b.count}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      brand: d.brand === b.value ? undefined : b.value,
                    }))
                  }
                >
                  {b.value}
                </Pill>
              ))}
            </div>
          ) : null}
          <Input
            label={brandFacets.length > 0 ? "Other brand" : "Brand"}
            value={
              brandSelectedFromFacet && brandFacets.length > 0
                ? ""
                : (draft.brand ?? "")
            }
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                brand: e.target.value || undefined,
              }))
            }
            placeholder="e.g. Burberry"
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Price (AED)</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min"
              inputMode="decimal"
              value={draft.minPrice ?? ""}
              onChange={(e) => {
                setPriceError(null);
                setDraft((d) => ({
                  ...d,
                  minPrice: e.target.value || undefined,
                }));
              }}
              placeholder="0"
            />
            <Input
              label="Max"
              inputMode="decimal"
              value={draft.maxPrice ?? ""}
              onChange={(e) => {
                setPriceError(null);
                setDraft((d) => ({
                  ...d,
                  maxPrice: e.target.value || undefined,
                }));
              }}
              placeholder="Any"
            />
          </div>
          {priceError ? (
            <p className="mt-2 text-xs text-muted">{priceError}</p>
          ) : null}
        </section>
      </div>
    </Sheet>
  );
}
