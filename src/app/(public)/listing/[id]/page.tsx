import type { Metadata } from "next";
import Link from "next/link";
import type { ListingCondition } from "@repose/api-types";
import { ConditionBadge } from "@/components/product/condition-badge";
import { ListingActions } from "@/components/product/listing-actions";
import { BuyButton } from "@/components/product/buy-button";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { PriceTag } from "@/components/product/price-tag";
import { ImageGallery } from "@/components/product/image-gallery";
import { RareFindBadge, SoldOverlay } from "@/components/product/badges";
import { TrackListingView } from "@/components/product/track-listing-view";
import {
  SimilarListingsRail,
  SellerListingsRail,
} from "@/components/product/recommendation-rails";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { ReportListingButton } from "@/components/product/report-listing-button";
import { serverFetch } from "@/lib/api-client";

type ListingDetail = {
  id: string;
  title: string;
  description?: string | null;
  brand?: string | null;
  size?: string | null;
  condition: ListingCondition;
  priceAed: string;
  status: string;
  isFeatured?: boolean;
  images: Array<{ url: string; sortOrder: number }>;
  category?: { id: string; name: string; slug: string };
  seller: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    reviewCount?: number;
  };
  isSavedByCurrentUser?: boolean;
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data } = await serverFetch<ListingDetail>(`/listings/${params.id}`, {
    cache: "no-store",
  });
  if (!data) return { title: "Listing" };
  return {
    title: data.title,
    description: data.description ?? undefined,
    openGraph: {
      title: data.title,
      images: data.images?.[0]?.url ? [data.images[0].url] : [],
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: listing, error } = await serverFetch<ListingDetail>(
    `/listings/${params.id}`,
    { cache: "no-store" },
  );

  if (error || !listing) {
    return (
      <div className="rounded-card border border-card-border bg-surface p-6 text-center">
        <p className="text-sm text-muted">
          Listing not found or the API is unavailable.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary">
          Back home
        </Link>
      </div>
    );
  }

  const sold = listing.status === "SOLD";
  const reviewCount = listing.seller.reviewCount ?? listing.seller.ratingCount;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description ?? undefined,
    image: listing.images?.map((i) => i.url),
    brand: listing.brand
      ? { "@type": "Brand", name: listing.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      price: listing.priceAed,
      availability:
        listing.status === "ACTIVE"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };

  return (
    <>
      <TrackListingView
        id={listing.id}
        title={listing.title}
        priceAed={listing.priceAed}
        condition={listing.condition}
        mainImageUrl={listing.images?.[0]?.url ?? null}
        isFeatured={listing.isFeatured}
        status={listing.status}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative">
          <ImageGallery images={listing.images ?? []} alt={listing.title} />
          {sold ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
              <SoldOverlay />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 lg:pb-28">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {listing.isFeatured ? <RareFindBadge /> : null}
              {listing.category ? (
                <Link
                  href={`/category/${listing.category.slug}`}
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {listing.category.name}
                </Link>
              ) : null}
            </div>
            {listing.brand ? (
              <p className="text-sm font-medium text-muted">{listing.brand}</p>
            ) : null}
            <h1 className="mt-1 text-2xl font-semibold leading-tight md:text-3xl">
              {listing.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriceTag priceAed={listing.priceAed} className="text-2xl" />
              <ConditionBadge condition={listing.condition} />
              {listing.size ? (
                <span className="rounded-pill border border-card-border bg-surface px-3 py-1 text-sm text-muted">
                  Size {listing.size}
                </span>
              ) : null}
            </div>
          </div>

          {listing.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/90">
              {listing.description}
            </p>
          ) : null}

          <Link
            href={`/seller/${listing.seller.username}`}
            className="flex items-center gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-accent-soft">
              {listing.seller.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.seller.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                  {listing.seller.username.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                @{listing.seller.username}
              </p>
              {listing.seller.ratingAvg != null ? (
                <p className="text-xs text-muted">
                  {Number(listing.seller.ratingAvg).toFixed(1)}★
                  {reviewCount ? ` · ${reviewCount} reviews` : ""} — view
                  closet
                </p>
              ) : (
                <p className="text-xs text-muted">View closet</p>
              )}
            </div>
          </Link>

          <div className="hidden flex-col gap-3 lg:flex">
            <ListingActions
              listingId={listing.id}
              sellerId={listing.seller.id}
              initiallySaved={Boolean(listing.isSavedByCurrentUser)}
            />
            {listing.status === "ACTIVE" ? (
              <>
                <BuyButton listingId={listing.id} priceAed={listing.priceAed} />
                <AddToCartButton listingId={listing.id} />
              </>
            ) : (
              <p className="text-sm text-muted">This item is not available.</p>
            )}
            <ReportListingButton listingId={listing.id} />
          </div>
        </div>
      </div>

      <SimilarListingsRail listingId={listing.id} />
      <SellerListingsRail
        sellerId={listing.seller.id}
        excludeId={listing.id}
      />
      <RecentlyViewedRail excludeId={listing.id} />

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-card-border bg-surface/95 px-screen py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          {listing.status === "ACTIVE" ? (
            <>
              <BuyButton listingId={listing.id} priceAed={listing.priceAed} />
              <AddToCartButton listingId={listing.id} />
            </>
          ) : null}
          <ListingActions
            listingId={listing.id}
            sellerId={listing.seller.id}
            initiallySaved={Boolean(listing.isSavedByCurrentUser)}
          />
        </div>
      </div>
    </>
  );
}
