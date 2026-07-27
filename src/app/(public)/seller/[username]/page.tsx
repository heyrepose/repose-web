import type { Metadata } from "next";
import type { ProductCardItem } from "@repose/api-types";
import { ProductGrid } from "@/components/product/product-grid";
import { SellerReviews } from "@/components/reviews/seller-reviews";
import { serverFetch } from "@/lib/api-client";

type SellerProfile = {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  ratingAvg?: number | string;
  ratingCount?: number;
  reviewCount?: number;
  itemsSoldCount?: number;
};

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  return { title: `@${params.username}` };
}

export default async function SellerPage({
  params,
}: {
  params: { username: string };
}) {
  const { data: seller, error } = await serverFetch<SellerProfile>(
    `/users/by-username/${encodeURIComponent(params.username)}`,
    { cache: "no-store" },
  );

  const listings = seller
    ? await serverFetch<ProductCardItem[]>(
        `/users/${seller.id}/listings?status=ACTIVE&limit=40`,
        { cache: "no-store" },
      )
    : { data: null, error: null };

  if (error || !seller) {
    return (
      <p className="rounded-card border border-card-border bg-surface p-6 text-center text-sm text-muted">
        Seller not found or API unavailable.
      </p>
    );
  }

  const ratingAvg =
    typeof seller.ratingAvg === "string"
      ? Number(seller.ratingAvg)
      : seller.ratingAvg;
  const reviewCount = seller.reviewCount ?? seller.ratingCount ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-4 rounded-card border border-card-border bg-surface p-6 text-center shadow-card sm:flex-row sm:text-left">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-accent-soft">
          {seller.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
              {seller.username.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">@{seller.username}</h1>
          {seller.fullName ? (
            <p className="text-sm text-muted">{seller.fullName}</p>
          ) : null}
          {seller.bio ? (
            <p className="mt-2 text-sm text-text/90">{seller.bio}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
            <span>
              <strong className="text-primary">
                {seller.itemsSoldCount ?? 0}
              </strong>{" "}
              <span className="text-muted">sold</span>
            </span>
            <span>
              <strong className="text-primary">
                {ratingAvg != null && !Number.isNaN(ratingAvg)
                  ? ratingAvg.toFixed(1)
                  : "—"}
              </strong>{" "}
              <span className="text-muted">
                rating{reviewCount ? ` (${reviewCount})` : ""}
              </span>
            </span>
            <span className="text-muted">
              {(listings.data ?? []).length} active
            </span>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <SellerReviews userId={seller.id} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Closet</h2>
        <ProductGrid
          items={listings.data ?? []}
          emptyTitle="Empty closet"
          emptyMessage={
            listings.error
              ? "Could not load listings."
              : "This seller has no active listings right now."
          }
        />
      </section>
    </div>
  );
}
