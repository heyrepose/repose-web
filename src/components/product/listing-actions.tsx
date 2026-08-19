"use client";

import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type SaveProps = {
  listingId: string;
  initiallySaved: boolean;
};

export function SaveButton({ listingId, initiallySaved }: SaveProps) {
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
      disabled={saveMutation.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!requireAuth()) return;
        saveMutation.mutate();
      }}
      className="flex h-[44px] w-[44px] items-center justify-center rounded-full hover:bg-[#D6E4DA] transition-colors"
      aria-label="Save listing"
    >
      <Heart
        className={cn(
          "h-6 w-6 transition-transform hover:scale-110",
          saved ? "fill-primary text-primary" : "text-text"
        )}
      />
    </button>
  );
}

type MessageProps = {
  listingId: string;
  sellerId: string;
};

export function MessageSellerButton({ listingId, sellerId }: MessageProps) {
  const requireAuth = useRequireAuth();
  const router = useRouter();
  const { toast } = useToast();

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
    <Button
      className="w-full bg-transparent text-primary border-[1.5px] border-primary hover:bg-accent-soft h-14 rounded-full font-bold"
      disabled={messageMutation.isPending}
      onClick={() => {
        if (!requireAuth()) return;
        messageMutation.mutate();
      }}
    >
      Message Seller
    </Button>
  );
}
