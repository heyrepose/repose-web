"use client";

import { useAuth } from "@/lib/hooks";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { BuyButton } from "@/components/product/buy-button";
import { OwnerListingActions } from "@/components/product/owner-listing-actions";
import { ReportListingButton } from "@/components/product/report-listing-button";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";

type Props = {
  listingId: string;
  sellerId: string;
  status: string;
  priceAed: string;
  /** Compact sticky footer for phone & tablet */
  stickyBar?: boolean;
};

export function ListingCtaBlock({
  listingId,
  sellerId,
  status,
  priceAed,
  stickyBar = false,
}: Props) {
  const { user } = useAuth();
  const isOwner = Boolean(user?.id && user.id === sellerId);
  const requireAuth = useRequireAuth();
  const router = useRouter();
  const { toast } = useToast();

  const messageMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ id: string }>("/conversations", {
        method: "POST",
        body: JSON.stringify({ listingId, sellerId }),
      }),
    onSuccess: (conv) => {
      toast("Opening chat…", "default");
      router.push(`/messages/${conv.id}`);
    },
    onError: (e) => toast("Could not start chat", "error", e),
  });

  if (isOwner) {
    return <OwnerListingActions listingId={listingId} status={status} />;
  }

  if (stickyBar) {
    if (status !== "ACTIVE") {
      return (
        <p className="w-full text-center text-sm text-muted">
          This item is no longer available
        </p>
      );
    }
    // Single primary CTA like the reference mock; message + buy as secondary.
    return (
      <div className="flex w-full flex-col gap-2">
        <AddToCartButton listingId={listingId} prominent />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="min-h-[48px]"
            disabled={messageMutation.isPending}
            onClick={() => {
              if (!requireAuth()) return;
              messageMutation.mutate();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
          <BuyButton
            listingId={listingId}
            priceAed={priceAed}
            className="min-h-[48px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "ACTIVE" ? (
        <>
          <AddToCartButton listingId={listingId} prominent />
          <BuyButton listingId={listingId} priceAed={priceAed} />
          <Button
            variant="outline"
            className="w-full"
            disabled={messageMutation.isPending}
            onClick={() => {
              if (!requireAuth()) return;
              messageMutation.mutate();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Message seller
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">This item is not available.</p>
      )}
      <ReportListingButton listingId={listingId} />
    </div>
  );
}
