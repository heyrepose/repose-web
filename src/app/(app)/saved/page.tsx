"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import type { ProductCardItem } from "@repose/api-types";
import { apiFetch } from "@/lib/api-client";
import { ProductGrid } from "@/components/product/product-grid";
import { TrendingRail } from "@/components/product/recommendation-rails";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SavedPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved"],
    queryFn: () => apiFetch<ProductCardItem[]>("/listings/saved?limit=40"),
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Saved</h1>
        <p className="mt-1 text-sm text-muted">Items you&apos;ve hearted.</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-muted">Could not load saved items.</p>
      ) : !data?.length ? (
        <>
          <EmptyState
            title="Nothing saved yet"
            description="Tap the heart on any listing to save it here."
            icon={<Heart className="h-6 w-6" />}
            action={
              <Link href="/search">
                <Button>Browse listings</Button>
              </Link>
            }
          />
          <TrendingRail title="Inspired for you" />
        </>
      ) : (
        <ProductGrid
          items={data}
          enableSave
          savedIds={data.map((i) => i.id)}
        />
      )}
    </div>
  );
}
