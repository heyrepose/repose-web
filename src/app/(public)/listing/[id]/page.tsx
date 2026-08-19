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
      {/* Full-screen white background for the product page */}
      <div className="fixed inset-0 -z-10 bg-surface pointer-events-none" aria-hidden="true" />

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
      
      {/* Container: Max width 1280px, 8pt grid base (gap-8/10 etc) */}
      <div className="mx-auto max-w-[1440px] pt-4 lg:pt-8 pb-16">
        <div className="grid gap-8 lg:grid-cols-[11fr_9fr] xl:gap-14 items-start">
          
          {/* Left: Image Gallery (~55%) */}
          <div className="relative">
            <ImageGallery images={listing.images ?? []} alt={listing.title} />
            {listing.isFeatured && (
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <RareFindBadge />
              </div>
            )}
            {sold ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
                <SoldOverlay />
              </div>
            ) : null}
          </div>

          {/* Right: Product Info Panel (Sticky, ~45%) */}
          <div className="flex flex-col lg:sticky lg:top-24 pb-8 lg:pb-0">
            <div className="flex justify-between items-start gap-4">
              <div>
                {listing.brand ? (
                  <h2 className="text-[13px] font-bold uppercase tracking-widest text-text font-sans mb-1.5">
                    {listing.brand}
                  </h2>
                ) : null}
                <h1 className="text-3xl lg:text-[2.5rem] font-bold font-sans text-text leading-[1.1] mb-2">
                  {listing.title}
                </h1>
              </div>
              <div className="-mt-2 -mr-2">
                <SaveButton listingId={listing.id} initiallySaved={Boolean(listing.isSavedByCurrentUser)} />
              </div>
            </div>

            <div className="mt-2 mb-8">
              <PriceTag priceAed={listing.priceAed} className="text-3xl mb-6 inline-block" />
              <div className="flex flex-wrap items-center gap-[10px]">
                <ConditionBadge condition={listing.condition} />
                
                {/* Size Pill */}
                {listing.size ? (
                  <span className="flex items-center justify-center rounded-full border border-[#E0E0E0] bg-surface px-4 h-10 text-xs font-bold uppercase tracking-wider text-[#888888]">
                    Size: {listing.size}
                  </span>
                ) : null}
                
                {/* Mock Color Pill */}
                <span className="flex items-center justify-center rounded-full border border-[#E0E0E0] bg-surface px-4 h-10 text-xs font-bold uppercase tracking-wider text-[#888888]">
                  Color: Black
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="hidden lg:block w-full">
              <ListingCtaBlock
                listingId={listing.id}
                sellerId={listing.seller.id}
                status={listing.status}
                priceAed={listing.priceAed}
                initiallySaved={Boolean(listing.isSavedByCurrentUser)}
              />
            </div>

            {/* Seller Card */}
            <SellerCard seller={listing.seller} />

            {/* Delivery Options */}
            <DeliveryOptions />

            {/* Description Accordion */}
            <DescriptionAccordion description={listing.description} condition={listing.condition} />

            {/* Trust Section */}
            <TrustSection />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px]">
        <SimilarListingsRail listingId={listing.id} />
        <SellerListingsRail
          sellerId={listing.seller.id}
          excludeId={listing.id}
        />
        <RecentlyViewedRail excludeId={listing.id} />
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-card-border bg-surface/95 px-screen py-4 pb-safe backdrop-blur lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2">
          <ListingCtaBlock
            listingId={listing.id}
            sellerId={listing.seller.id}
            status={listing.status}
            priceAed={listing.priceAed}
            initiallySaved={Boolean(listing.isSavedByCurrentUser)}
            compact
          />
        </div>
      </div>
    </>
  );
}
