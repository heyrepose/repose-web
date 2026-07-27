"use client";

import { useEffect, useState } from "react";
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
};

const CONDITIONS = Object.keys(CONDITION_BADGE) as ListingCondition[];

export function FilterDrawer({
  open,
  onClose,
  value,
  onApply,
  categories = [],
  facets,
}: Props) {
  const [draft, setDraft] = useState<FilterState>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  function reset() {
    setDraft({});
  }

  function apply() {
    onApply(draft);
    onClose();
  }

  const brandOptions = facets?.brand?.map((b) => b.value) ?? [];
  const sizeOptions = facets?.size?.map((s) => s.value) ?? [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
  ];

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
        {categories.length > 0 ? (
          <section>
            <h3 className="mb-3 text-sm font-semibold">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      category: d.category === c.slug ? undefined : c.slug,
                    }))
                  }
                  className={cn(
                    "rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                    draft.category === c.slug
                      ? "bg-primary text-surface"
                      : "bg-accent-soft text-muted",
                  )}
                >
                  {c.name}
                </button>
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
              const selected = draft.condition === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      condition: selected ? undefined : c,
                    }))
                  }
                  className={cn(
                    "rounded-pill px-3 py-2 text-sm font-medium",
                    selected
                      ? "bg-primary text-surface"
                      : "bg-surface text-muted border border-card-border",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    size: d.size === s ? undefined : s,
                  }))
                }
                className={cn(
                  "min-w-[44px] rounded-pill px-3 py-2 text-sm font-medium",
                  draft.size === s
                    ? "bg-primary text-surface"
                    : "border border-card-border bg-surface text-muted",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {brandOptions.length > 0 ? (
          <section>
            <h3 className="mb-3 text-sm font-semibold">Brand</h3>
            <div className="flex flex-wrap gap-2">
              {brandOptions.slice(0, 24).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      brand: d.brand === b ? undefined : b,
                    }))
                  }
                  className={cn(
                    "rounded-pill px-3 py-2 text-sm font-medium",
                    draft.brand === b
                      ? "bg-primary text-surface"
                      : "border border-card-border bg-surface text-muted",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <Input
            label="Brand"
            value={draft.brand ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                brand: e.target.value || undefined,
              }))
            }
            placeholder="e.g. Burberry"
          />
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold">Price (AED)</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min"
              inputMode="decimal"
              value={draft.minPrice ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  minPrice: e.target.value || undefined,
                }))
              }
              placeholder="0"
            />
            <Input
              label="Max"
              inputMode="decimal"
              value={draft.maxPrice ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  maxPrice: e.target.value || undefined,
                }))
              }
              placeholder="Any"
            />
          </div>
        </section>
      </div>
    </Sheet>
  );
}
