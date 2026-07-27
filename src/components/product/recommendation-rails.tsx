"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductCardItem } from "@repose/api-types";
import { apiFetch } from "@/lib/api-client";
import { ProductGrid } from "@/components/product/product-grid";
import { Spinner } from "@/components/ui/spinner";

type RawCard = {
  id: string;
  title: string | null;
  priceAed: string | null;
  condition: string | null;
  mainImageUrl: string | null;
  isFeatured?: boolean;
  status?: string;
};

function toGridItems(data: RawCard[]): ProductCardItem[] {
  return data.map((i) => ({
    id: i.id,
    title: i.title ?? "Listing",
    priceAed: i.priceAed ?? "0",
    condition: (i.condition ?? "GOOD") as ProductCardItem["condition"],
    mainImageUrl: i.mainImageUrl,
    isFeatured: i.isFeatured,
    status: i.status as ProductCardItem["status"],
  }));
}

export function SimilarListingsRail({
  listingId,
  title = "You may also like",
}: {
  listingId: string;
  title?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["listings", listingId, "similar"],
    queryFn: () => apiFetch<RawCard[]>(`/listings/${listingId}/similar?limit=8`),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <ProductGrid items={toGridItems(data)} />
    </section>
  );
}

export function SellerListingsRail({
  sellerId,
  excludeId,
  title = "More from this seller",
}: {
  sellerId: string;
  excludeId?: string;
  title?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["users", sellerId, "listings", "rail"],
    queryFn: () =>
      apiFetch<RawCard[]>(
        `/users/${sellerId}/listings?status=ACTIVE&limit=8`,
      ),
  });

  const items = (data ?? []).filter((i) => i.id !== excludeId);
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }
  if (!items.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <ProductGrid items={toGridItems(items)} />
    </section>
  );
}

export function TrendingRail({ title = "Trending now" }: { title?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["search", "trending-rail"],
    queryFn: () => apiFetch<RawCard[]>("/search?sort=newest&limit=8"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }
  if (!data?.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <ProductGrid items={toGridItems(data)} />
    </section>
  );
}
