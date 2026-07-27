"use client";

import { useEffect, useState } from "react";
import type { ProductCardItem } from "@repose/api-types";
import { ProductGrid } from "@/components/product/product-grid";
import {
  clearRecentlyViewed,
  getRecentlyViewed,
  type RecentViewItem,
} from "@/lib/history";
import { Button } from "@/components/ui/button";

function toGridItems(items: RecentViewItem[]): ProductCardItem[] {
  return items.map((i) => ({
    id: i.id,
    title: i.title ?? "Listing",
    priceAed: i.priceAed ?? "0",
    condition: (i.condition ?? "GOOD") as ProductCardItem["condition"],
    mainImageUrl: i.mainImageUrl,
    isFeatured: i.isFeatured,
    status: i.status as ProductCardItem["status"],
  }));
}

export function RecentlyViewedRail({
  excludeId,
  title = "Recently viewed",
}: {
  excludeId?: string;
  title?: string;
}) {
  const [items, setItems] = useState<RecentViewItem[]>([]);

  useEffect(() => {
    setItems(
      getRecentlyViewed().filter((i) => (excludeId ? i.id !== excludeId : true)),
    );
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          variant="ghost"
          className="h-auto px-2 py-1 text-xs text-muted"
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
        >
          Clear
        </Button>
      </div>
      <ProductGrid items={toGridItems(items)} enableSave={false} />
    </section>
  );
}
