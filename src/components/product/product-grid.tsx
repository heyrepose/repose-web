"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductCardItem } from "@repose/api-types";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";
import { useState } from "react";

type Props = {
  items: ProductCardItem[];
  className?: string;
  emptyMessage?: string;
  emptyTitle?: string;
  /** Enable save hearts (requires auth gate) */
  enableSave?: boolean;
  savedIds?: Set<string> | string[];
};

export function ProductGrid({
  items,
  className,
  emptyMessage = "Nothing here yet — check back soon.",
  emptyTitle = "No listings",
  enableSave = true,
  savedIds,
}: Props) {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [localSaved, setLocalSaved] = useState<Set<string>>(() => {
    if (!savedIds) return new Set();
    return new Set(Array.isArray(savedIds) ? savedIds : [...savedIds]);
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      currentlySaved,
    }: {
      id: string;
      currentlySaved: boolean;
    }) => {
      if (currentlySaved) {
        await apiFetch(`/listings/${id}/save`, { method: "DELETE" });
        return false;
      }
      await apiFetch(`/listings/${id}/save`, { method: "POST" });
      return true;
    },
    onSuccess: (next, { id }) => {
      setLocalSaved((prev) => {
        const n = new Set(prev);
        if (next) n.add(id);
        else n.delete(id);
        return n;
      });
      void qc.invalidateQueries({ queryKey: ["saved"] });
      toast(next ? "Saved" : "Removed from saved", "success");
    },
    onError: (e) => toast("Could not update saved item", "error", e),
  });

  if (!items.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyMessage}
        icon={<PackageOpen className="h-6 w-6" />}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          saved={localSaved.has(item.id)}
          onSave={
            enableSave
              ? (id) => {
                  if (!requireAuth()) return;
                  saveMutation.mutate({
                    id,
                    currentlySaved: localSaved.has(id),
                  });
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
