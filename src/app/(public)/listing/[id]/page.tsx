import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Ruler, Sparkles, Tag } from "lucide-react";
import type { ListingCondition } from "@repose/api-types";
import { CONDITION_BADGE, type ListingConditionKey } from "@repose/ui";
import { PriceTag } from "@/components/product/price-tag";
import { ImageGallery } from "@/components/product/image-gallery";
import { RareFindBadge } from "@/components/product/badges";
import { TrackListingView } from "@/components/product/track-listing-view";
import {
  SimilarListingsRail,
  SellerListingsRail,
} from "@/components/product/recommendation-rails";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { ListingCtaBlock } from "@/components/product/listing-cta-block";
import { ListingDetailChrome } from "@/components/product/listing-detail-chrome";
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

function conditionLabel(condition: string): string {
  return (
    CONDITION_BADGE[condition as ListingConditionKey]?.label ??
    condition.replace(/_/g, " ")
  );
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
  const subtitle =
    listing.brand ??
    listing.category?.name ??
    (listing.size ? `Size ${listing.size}` : null);

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

  const detailTiles = [
    {
      key: "condition",
      label: "Condition",
      value: conditionLabel(listing.condition),
      icon: Sparkles,
    },
    {
      key: "size",
      label: "Size",
      value: listing.size ?? "—",
      icon: Ruler,
    },
    {
      key: "brand",
      label: "Brand",
      value: listing.brand ?? "—",
      icon: Tag,
    },
  ];

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

      {/*
        Phone/tablet: single column (chrome → gallery → details → sticky CTA)
        Desktop (lg+): two columns — gallery left, details + buttons right
      */}
      <article className="mx-auto w-full max-w-lg pb-52 md:max-w-xl md:pb-44 lg:max-w-6xl lg:pb-12">
        {/* Mobile chrome only — desktop chrome sits above the right column */}
        <ListingDetailChrome
          listingId={listing.id}
          initiallySaved={Boolean(listing.isSavedByCurrentUser)}
          className="mb-3 lg:hidden"
        />

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-12">
          {/* Left: images */}
          <div className="lg:sticky lg:top-20">
            <ImageGallery
              images={listing.images ?? []}
              alt={listing.title}
              sold={sold}
            />
          </div>

          {/* Right: details + CTAs */}
          <div className="flex min-w-0 flex-col">
            <ListingDetailChrome
              listingId={listing.id}
              initiallySaved={Boolean(listing.isSavedByCurrentUser)}
              className="mb-4 hidden lg:flex"
            />

            {/* Title, then brand, then price — full-width stack so long titles don't push price */}
            <header className="mt-6 flex flex-col gap-3 lg:mt-0">
              <div className="flex flex-wrap items-center gap-2">
                {listing.isFeatured ? <RareFindBadge /> : null}
                {listing.category ? (
                  <Link
                    href={`/category/${listing.category.slug}`}
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"
                  >
                    {listing.category.name}
                  </Link>
                ) : null}
              </div>

              <h1 className="text-[1.65rem] font-semibold leading-[1.2] tracking-tight text-text md:text-3xl">
                {listing.title}
              </h1>

              {subtitle ? (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                  {listing.brand ? listing.brand : listing.category?.name}
                  {listing.brand && listing.size ? " · " : null}
                  {listing.brand && listing.size
                    ? `Size ${listing.size}`
                    : null}
                  {!listing.brand && listing.size
                    ? `Size ${listing.size}`
                    : null}
                </p>
              ) : null}

              <PriceTag
                priceAed={listing.priceAed}
                className="text-[1.75rem] font-semibold tabular-nums leading-none text-text md:text-[2rem]"
              />
            </header>

            {/* Description */}
            <section className="mt-5 border-b border-card-border pb-5">
              <p className="text-sm leading-relaxed text-text/85">
                {listing.description?.trim()
                  ? listing.description
                  : "No description from the seller. Message them if you need more detail on fabric, fit, or wear."}
              </p>
            </section>

            {/* Details grid */}
            <section className="border-b border-card-border py-5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-text">
                Details
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {detailTiles.map(({ key, label, value, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex flex-col items-center gap-2 px-1 text-center"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text">
                        {label}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Seller */}
            <section className="py-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-text">
                Seller
              </h2>
              <Link
                href={`/seller/${listing.seller.username}`}
                className="flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-card ring-1 ring-card-border transition-colors hover:bg-accent-soft/40"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-accent-soft">
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
                  <p className="text-sm font-semibold text-text">
                    @{listing.seller.username}
                  </p>
                  {listing.seller.ratingAvg != null ? (
                    <p className="text-xs text-muted">
                      {Number(listing.seller.ratingAvg).toFixed(1)}★
                      {reviewCount ? ` · ${reviewCount} reviews` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">View closet</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </Link>
            </section>

            {/* Desktop CTAs — inline under details */}
            <div className="mt-1 hidden lg:block">
              <ListingCtaBlock
                listingId={listing.id}
                sellerId={listing.seller.id}
                status={listing.status}
                priceAed={listing.priceAed}
              />
            </div>
          </div>
        </div>

        {/* Rails full width below the grid */}
        <div className="mt-10 space-y-2 border-t border-card-border pt-8 lg:mt-14">
          <SimilarListingsRail listingId={listing.id} />
          <SellerListingsRail
            sellerId={listing.seller.id}
            excludeId={listing.id}
          />
          <RecentlyViewedRail excludeId={listing.id} />
        </div>
      </article>

      {/* Sticky CTA — phone & tablet only */}
      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 border-t border-card-border bg-surface/95 px-screen py-3 backdrop-blur md:bottom-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto w-full max-w-lg md:max-w-xl">
          <ListingCtaBlock
            listingId={listing.id}
            sellerId={listing.seller.id}
            status={listing.status}
            priceAed={listing.priceAed}
            stickyBar
          />
        </div>
      </div>
    </>
  );
}
