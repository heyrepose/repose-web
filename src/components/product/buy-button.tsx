"use client";

import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";

export function BuyButton({
  listingId,
  priceAed,
}: {
  listingId: string;
  priceAed: string;
}) {
  const requireAuth = useRequireAuth();
  const router = useRouter();

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => {
        if (!requireAuth()) return;
        sessionStorage.setItem(
          "repose_checkout_listing",
          JSON.stringify({ listingId, priceAed }),
        );
        router.push(`/checkout?listingId=${listingId}`);
      }}
    >
      Buy now
    </Button>
  );
}
