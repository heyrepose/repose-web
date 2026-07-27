"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ProductCardItem } from "@repose/api-types";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function MyListingsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"ACTIVE" | "SOLD" | "DRAFT">("ACTIVE");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-listings", user?.id, status],
    enabled: Boolean(user?.id),
    queryFn: () =>
      apiFetch<ProductCardItem[]>(
        `/users/${user!.id}/listings?status=${status}&limit=40`,
      ),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">My listings</h1>
      <div className="flex gap-2">
        {(["ACTIVE", "SOLD", "DRAFT"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "primary" : "outline"}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-muted">Could not load listings.</p>
      ) : (
        <ProductGrid items={data ?? []} emptyMessage="No listings in this tab." />
      )}
    </div>
  );
}
