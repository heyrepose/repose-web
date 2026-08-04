import Link from "next/link";
import type { ProductCardItem } from "@repose/api-types";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { serverFetch } from "@/lib/api-client";
import { categoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

export const revalidate = 60;

type FeedSection = {
  title: string;
  categorySlug?: string;
  listings: ProductCardItem[];
};

type HomeFeed = {
  trendingTags?: string[];
  sections: FeedSection[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const CATEGORY_TAGLINES: Record<string, string> = {
  women: "Curated essentials",
  men: "Wardrobe staples",
  shoes: "All genders",
  bags: "Handbags & totes",
  accessories: "Finishing touches",
};

export default async function HomePage() {
  const [{ data: feed, error }, { data: categories }] = await Promise.all([
    serverFetch<HomeFeed>("/feed/home", { next: { revalidate: 60 } }),
    serverFetch<Category[]>("/categories", { next: { revalidate: 120 } }),
  ]);

  const activeCategories = (categories ?? []).filter(
    (c) => c.slug !== "kids",
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="relative -mx-screen overflow-hidden bg-primary px-screen py-12 text-surface md:mx-0 md:rounded-card md:px-8">
        <p className="font-brand text-4xl md:text-5xl">Repose</p>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.28em] text-accent-soft">
          Pose it. Post it. Sell it.
        </p>
        <h1 className="mt-4 max-w-md text-2xl font-semibold leading-tight md:text-3xl">
          Pre-loved fashion, curated for the UAE
        </h1>
        <p className="mt-3 max-w-md text-sm text-accent-soft/90">
          Browse without an account. Save, message, and checkout when you&apos;re
          ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex min-h-[48px] items-center rounded-pill bg-surface px-6 text-sm font-semibold text-primary"
          >
            Explore
          </Link>
          <Link
            href="/sell"
            className="inline-flex min-h-[48px] items-center rounded-pill border border-surface/40 px-6 text-sm font-semibold text-surface"
          >
            Start selling
          </Link>
        </div>
      </section>

      {activeCategories.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {activeCategories.map((c) => {
              const Icon = categoryIcon(c.slug);
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-card border border-card-border bg-surface p-5 shadow-card transition-colors hover:border-primary/40 hover:bg-accent-soft/40"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-card bg-accent-soft text-primary">
                    <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="text-center">
                    <span className="block text-base font-semibold text-text">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {CATEGORY_TAGLINES[c.slug] ?? "Shop now"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {feed?.trendingTags && feed.trendingTags.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Trending</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {feed.trendingTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className={cn(
                  "shrink-0 rounded-pill bg-accent-soft px-4 py-2 text-sm font-medium text-primary",
                )}
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-card border border-card-border bg-surface p-4 text-sm text-muted">
          Feed unavailable right now. Check that the API is running at{" "}
          <code className="text-primary">localhost:4000</code>.
        </p>
      ) : null}

      {(feed?.sections ?? []).map((section) => (
        <section key={section.title}>
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {section.categorySlug ? (
              <Link
                href={`/category/${section.categorySlug}`}
                className="text-sm font-medium text-primary"
              >
                See all
              </Link>
            ) : null}
          </div>
          <ProductGrid items={section.listings ?? []} />
        </section>
      ))}

      <RecentlyViewedRail />

      {!error && (!feed?.sections || feed.sections.length === 0) ? (
        <p className="py-12 text-center text-sm text-muted">
          Nothing in the feed yet — check back soon.
        </p>
      ) : null}
    </div>
  );
}
