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
      className={cn(
        "h-14 w-full rounded-full font-bold shadow-none transition-shadow hover:shadow-[0_4px_12px_rgba(38,74,46,0.25)]",
        className,
      )}
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
