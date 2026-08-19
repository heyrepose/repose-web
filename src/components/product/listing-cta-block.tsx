"use client";

import { useAuth } from "@/lib/hooks";
import { MessageSellerButton } from "@/components/product/listing-actions";
import { BuyButton } from "@/components/product/buy-button";
import { OwnerListingActions } from "@/components/product/owner-listing-actions";
import { ReportListingButton } from "@/components/product/report-listing-button";

type Props = {
  listingId: string;
  sellerId: string;
  status: string;
  priceAed: string;
  initiallySaved?: boolean;
  compact?: boolean;
};

/** Buyer CTA block or owner management — client so we can compare auth user. */
export function ListingCtaBlock({
  listingId,
  sellerId,
  status,
  priceAed,
  initiallySaved,
  compact = false,
}: Props) {
  const { user } = useAuth();
  const isOwner = Boolean(user?.id && user.id === sellerId);

  if (isOwner) {
    return <OwnerListingActions listingId={listingId} status={status} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "ACTIVE" ? (
        <>
          <BuyButton listingId={listingId} priceAed={priceAed} />
          <MessageSellerButton listingId={listingId} sellerId={sellerId} />
        </>
      ) : !compact ? (
        <p className="text-sm text-muted">This item is not available.</p>
      ) : null}
      {!compact ? (
        <div className="mt-2">
          <ReportListingButton listingId={listingId} />
        </div>
      ) : null}
    </div>
  );
}
