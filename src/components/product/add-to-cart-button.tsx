"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  listingId,
  prominent = false,
}: {
  listingId: string;
  prominent?: boolean;
}) {
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
      toast("Could not add to bag", "error", e);
    },
  });

  return (
    <Button
      variant="primary"
      size={prominent ? "lg" : "default"}
      className={cn(
        "w-full uppercase tracking-[0.12em]",
        prominent && "min-h-[56px] text-[13px] font-semibold",
      )}
      disabled={mutation.isPending}
      onClick={() => {
        if (!requireAuth()) return;
        mutation.mutate();
      }}
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={2} />
      {mutation.isPending ? "Adding…" : "Add to bag"}
    </Button>
  );
}
