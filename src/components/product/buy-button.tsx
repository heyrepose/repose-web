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
      className="w-full h-14 rounded-full font-bold shadow-none hover:shadow-[0_4px_12px_rgba(38,74,46,0.25)] transition-shadow"
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
