import type { Metadata } from "next";
import Link from "next/link";
import type { ListingCondition } from "@repose/api-types";
import { ConditionBadge } from "@/components/product/condition-badge";
import { PriceTag } from "@/components/product/price-tag";
import { ImageGallery } from "@/components/product/image-gallery";
import { RareFindBadge, SoldOverlay } from "@/components/product/badges";
import { TrackListingView } from "@/components/product/track-listing-view";
import {
  SimilarListingsRail,
  SellerListingsRail,
} from "@/components/product/recommendation-rails";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { ListingCtaBlock } from "@/components/product/listing-cta-block";
import { SaveButton } from "@/components/product/listing-actions";
import { SellerCard } from "@/components/product/seller-card";
import { DeliveryOptions } from "@/components/product/delivery-options";
import { TrustSection } from "@/components/product/trust-section";
import { DescriptionAccordion } from "@/components/product/description-accordion";
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
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-surface"
        aria-hidden="true"
      />

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

      <div className="mx-auto max-w-[1440px] pb-28 pt-4 lg:pb-16 lg:pt-8">
        <div className="grid items-start gap-8 lg:grid-cols-[11fr_9fr] xl:gap-14">
          <div className="relative">
            <ImageGallery images={listing.images ?? []} alt={listing.title} />
            {listing.isFeatured ? (
              <div className="pointer-events-none absolute right-4 top-4 z-20">
                <RareFindBadge />
              </div>
            ) : null}
            {sold ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
                <SoldOverlay />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col pb-8 lg:sticky lg:top-24 lg:pb-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                {listing.brand ? (
                  <h2 className="mb-1.5 font-sans text-[13px] font-bold uppercase tracking-widest text-text">
                    {listing.brand}
                  </h2>
                ) : null}
                <h1 className="mb-2 font-sans text-3xl font-bold leading-[1.1] text-text lg:text-[2.5rem]">
                  {listing.title}
                </h1>
              </div>
              <div className="-mr-2 -mt-2">
                <SaveButton
                  listingId={listing.id}
                  initiallySaved={Boolean(listing.isSavedByCurrentUser)}
                />
              </div>
            </div>

            <div className="mb-8 mt-2">
              <PriceTag
                priceAed={listing.priceAed}
                className="mb-6 inline-block text-3xl"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <ConditionBadge condition={listing.condition} />
                {listing.size ? (
                  <span className="flex h-10 items-center justify-center rounded-full border border-card-border bg-surface px-4 text-xs font-bold uppercase tracking-wider text-muted">
                    Size: {listing.size}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="hidden w-full lg:block">
              <ListingCtaBlock
                listingId={listing.id}
                sellerId={listing.seller.id}
                status={listing.status}
                priceAed={listing.priceAed}
              />
            </div>

            <SellerCard seller={listing.seller} />
            <DeliveryOptions />
            <DescriptionAccordion
              description={listing.description}
              condition={listing.condition}
            />
            <TrustSection />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-screen pb-24 lg:pb-8">
        <SimilarListingsRail listingId={listing.id} />
        <SellerListingsRail
          sellerId={listing.seller.id}
          excludeId={listing.id}
        />
        <RecentlyViewedRail excludeId={listing.id} />
      </div>

      {/* Sit above mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 border-t border-card-border bg-surface/95 px-screen py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2">
          <ListingCtaBlock
            listingId={listing.id}
            sellerId={listing.seller.id}
            status={listing.status}
            priceAed={listing.priceAed}
            compact
          />
        </div>
      </div>
    </>
  );
}
