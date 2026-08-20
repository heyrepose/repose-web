"use client";

import { useMutation } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Props = {
  listingId: string;
  sellerId: string;
  initiallySaved: boolean;
};

export function ListingActions({ listingId, sellerId, initiallySaved }: Props) {
  const requireAuth = useRequireAuth();
  const router = useRouter();
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

  const messageMutation = useMutation({
    mutationFn: async () => {
      const conv = await apiFetch<{ id: string }>("/conversations", {
        method: "POST",
        body: JSON.stringify({ listingId, sellerId }),
      });
      return conv;
    },
    onSuccess: (conv) => {
      toast("Opening chat…", "default");
      router.push(`/messages/${conv.id}`);
    },
    onError: (e) => toast("Could not start chat", "error", e),
  });

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        variant="outline"
        className="flex-1"
        disabled={saveMutation.isPending}
        onClick={() => {
          if (!requireAuth()) return;
          saveMutation.mutate();
        }}
      >
        <Heart className={saved ? "fill-primary" : undefined} />
        {saved ? "Saved" : "Save"}
      </Button>
      <Button
        className="flex-1"
        disabled={messageMutation.isPending}
        onClick={() => {
          if (!requireAuth()) return;
          messageMutation.mutate();
        }}
      >
        <MessageCircle />
        Message seller
      </Button>
    </div>
  );
}
