"use client";

import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initiallySaved: boolean;
  className?: string;
};

export function ListingSaveHeart({
  listingId,
  initiallySaved,
  className,
}: Props) {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(initiallySaved);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (saved) {
        await apiFetch(`/listings/${listingId}/save`, { method: "DELETE" });
        return false;
      }
      await apiFetch(`/listings/${listingId}/save`, { method: "POST" });
      return true;
    },
    onSuccess: (next) => {
      setSaved(next);
      toast(next ? "Saved to wishlist" : "Removed from saved", "success");
    },
    onError: (e) => toast("Could not update saved", "error", e),
  });

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      disabled={saveMutation.isPending}
      onClick={() => {
        if (!requireAuth()) return;
        saveMutation.mutate();
      }}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent-soft",
        saved && "animate-heart",
        className,
      )}
    >
      <Heart
        className={cn("h-6 w-6", saved && "fill-primary")}
        strokeWidth={1.75}
      />
    </button>
  );
}
