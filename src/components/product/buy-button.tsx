"use client";

import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BuyButton({
  listingId,
  priceAed,
  className,
}: {
  listingId: string;
  priceAed: string;
  className?: string;
}) {
  const requireAuth = useRequireAuth();
  const router = useRouter();

  return (
    <Button
      size="lg"
      variant="secondary"
      className={cn("w-full", className)}
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
