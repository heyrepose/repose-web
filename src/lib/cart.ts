"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks";

export type CartListing = {
  id: string;
  title: string | null;
  priceAed: string | null;
  condition: string | null;
  mainImageUrl: string | null;
  isFeatured?: boolean;
  status?: string;
};

export type CartResponse = {
  id: string;
  itemCount: number;
  availableCount: number;
  subtotalAed: string;
  groups: Array<{
    seller: {
      id: string;
      username: string | null;
      avatarUrl: string | null;
    };
    items: Array<{
      listingId: string;
      addedAt: string;
      isAvailable: boolean;
      listing: CartListing;
    }>;
  }>;
};

export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["cart"],
    enabled: isAuthenticated,
    queryFn: () => apiFetch<CartResponse>("/cart"),
    staleTime: 15_000,
  });
}

export function useCartCount() {
  const { data } = useCart();
  return data?.itemCount ?? 0;
}

export function useInvalidateCart() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["cart"] });
}
