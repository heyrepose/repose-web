"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import type { ListingCondition } from "@repose/api-types";
import { CONDITION_BADGE, type ListingConditionKey } from "@repose/ui";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { PriceTag } from "@/components/product/price-tag";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { formatAed } from "@/lib/utils";

type ListingDetail = {
  id: string;
  status: string;
  title?: string | null;
  brand?: string | null;
  size?: string | null;
  description?: string | null;
  condition?: ListingCondition | null;
  priceAed?: string | null;
  images: Array<{ url: string; sortOrder: number }>;
  category?: { name: string; slug: string } | null;
};

function conditionLabel(c?: string | null): string {
  if (!c) return "—";
  return (
    CONDITION_BADGE[c as ListingConditionKey]?.label ?? c.replace(/_/g, " ")
  );
}

/**
 * Final sell step: review the draft listing, then publish.
 * (Seller "checkout" — not buyer payment.)
 */
export default function SellCheckoutPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const { data: listing, isLoading, refetch } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => apiFetch<ListingDetail>(`/listings/${listingId}`),
  });

  async function publish() {
    if (!listing) return;
    setError(null);
    setBusy(true);
    try {
      if (!listing.images?.length) {
        setError("Add at least one photo before publishing.");
        setBusy(false);
        return;
      }
      if (!listing.condition || !listing.priceAed) {
        setError("Set condition and price before publishing.");
        setBusy(false);
        return;
      }

      const data = await apiFetch<{ id: string; status: string }>(
        `/listings/${listingId}/publish`,
        {
          method: "PATCH",
          body: JSON.stringify({
            condition: listing.condition,
            priceAed: listing.priceAed,
          }),
        },
      );
      setPublishedId(data.id);
      toast("Listing published", "success");
      void refetch();
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not publish listing.");
      setError(message);
      toast("Could not publish listing.", "error", e);
      setBusy(false);
    }
  }

  async function shareListing() {
    const url = `${window.location.origin}/listing/${publishedId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Repose listing", url });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied", "success");
  }

  if (isLoading || !listing) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (publishedId || listing.status === "ACTIVE") {
    const id = publishedId ?? listing.id;
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-8 text-center animate-scale-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Listing is live</h1>
          <p className="mt-2 text-sm text-muted">
            Share your piece — buyers can find it in search and the feed.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link href={`/listing/${id}`} className="w-full">
            <Button className="w-full">View listing</Button>
          </Link>
          <Link href={`/sell/${listingId}/edit`} className="w-full">
            <Button variant="outline" className="w-full">
              Edit listing
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={shareListing}>
            Share link
          </Button>
          <Link href="/sell" className="w-full">
            <Button variant="ghost" className="w-full">
              List another item
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const cover = [...(listing.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];
  const photoCount = listing.images?.length ?? 0;
  const canPublish =
    photoCount >= 1 &&
    Boolean(listing.title) &&
    Boolean(listing.condition) &&
    Boolean(listing.priceAed);

  return (
    <div className="mx-auto max-w-lg pb-8">
      <h1 className="text-2xl font-semibold">Review & publish</h1>
      <p className="mt-1 text-sm text-muted">
        Check everything looks right, then publish. You can edit anytime after.
      </p>

      <div className="mt-6 overflow-hidden rounded-card border border-card-border bg-surface shadow-card">
        <div className="relative aspect-[4/5] w-full bg-accent-soft">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No photo
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          {listing.category ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {listing.category.name}
            </p>
          ) : null}
          <h2 className="text-xl font-semibold leading-snug">
            {listing.title || "Untitled"}
          </h2>
          {listing.brand || listing.size ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {[listing.brand, listing.size ? `Size ${listing.size}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          <PriceTag
            priceAed={listing.priceAed ?? "0"}
            className="text-2xl font-semibold"
          />
          <dl className="grid grid-cols-2 gap-3 border-t border-card-border pt-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Condition</dt>
              <dd className="font-medium">
                {conditionLabel(listing.condition)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Photos</dt>
              <dd className="font-medium">
                {photoCount} photo{photoCount === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
          {listing.description?.trim() ? (
            <p className="line-clamp-4 border-t border-card-border pt-3 text-sm leading-relaxed text-text/85">
              {listing.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-card border border-card-border bg-accent-soft/30 p-3 text-sm">
        <p className="font-medium text-primary">Summary</p>
        <p className="text-muted">
          Buyers will pay{" "}
          <span className="font-semibold text-text">
            {formatAed(listing.priceAed ?? "0")}
          </span>
          . Platform commission (10%) is taken from seller proceeds when the
          item sells — not added for the buyer.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/sell/${listingId}/details`}
          className="rounded-pill border border-card-border bg-surface px-3 py-2 text-xs font-medium"
        >
          Edit details
        </Link>
        <Link
          href={`/sell/${listingId}/condition-price`}
          className="rounded-pill border border-card-border bg-surface px-3 py-2 text-xs font-medium"
        >
          Edit price
        </Link>
        <Link
          href={`/sell/${listingId}/photos`}
          className="rounded-pill border border-card-border bg-surface px-3 py-2 text-xs font-medium"
        >
          Edit photos
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-muted">{error}</p> : null}
      {!canPublish ? (
        <p className="mt-3 text-sm text-muted">
          Complete title, condition, price, and at least one photo to publish.
        </p>
      ) : null}

      <Button
        className="mt-6 w-full"
        disabled={busy || !canPublish}
        onClick={publish}
      >
        {busy ? <Spinner className="h-4 w-4" /> : null}
        Publish listing
      </Button>
    </div>
  );
}
