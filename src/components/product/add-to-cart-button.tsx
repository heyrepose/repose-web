"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function AddToCartButton({ listingId }: { listingId: string }) {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ listingId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast("Added to bag", "success");
    },
    onError: (e) => {
      toast(
        e instanceof ApiError ? e.message : "Could not add to bag",
        "error",
      );
    },
  });

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      disabled={mutation.isPending}
      onClick={() => {
        if (!requireAuth()) return;
        mutation.mutate();
      }}
    >
      <ShoppingBag className="h-4 w-4" />
      {mutation.isPending ? "Adding…" : "Add to bag"}
    </Button>
  );
}
