import type { ProductCardItem } from "@repose/api-types";
import { HomeHero } from "@/components/home/home-hero";
import {
  ShopByCategory,
  type HomeCategoryCard,
} from "@/components/home/shop-by-category";
import { NewArrivals } from "@/components/home/new-arrivals";
import { ClosetWorthBanner } from "@/components/home/closet-worth-banner";
import { serverFetch, serverFetchWithMeta } from "@/lib/api-client";

export const revalidate = 120;

const CATEGORY_ORDER = ["men", "women", "shoes", "bags", "accessories"] as const;

type Category = {
  id: string;
  name: string;
  slug: string;
};

async function loadCategories(): Promise<HomeCategoryCard[]> {
  const { data: all } = await serverFetch<Category[]>("/categories", {
    next: { revalidate: 120 },
  });

  const bySlug = new Map((all ?? []).map((c) => [c.slug, c]));
  const ordered = CATEGORY_ORDER.map((slug) => bySlug.get(slug)).filter(
    (c): c is Category => Boolean(c),
  );
  const list =
    ordered.length > 0
      ? ordered
      : (all ?? []).slice(0, 5);

  const cards = await Promise.all(
    list.map(async (cat) => {
      const { data, meta } = await serverFetchWithMeta<ProductCardItem[]>(
        `/search?category=${encodeURIComponent(cat.slug)}&sort=newest&limit=1`,
        { next: { revalidate: 120 } },
      );
      return {
        name: cat.name,
        slug: cat.slug,
        listingCount: meta?.resultCount ?? data?.length ?? 0,
        imageUrl: data?.[0]?.mainImageUrl ?? null,
      };
    }),
  );

  return cards;
}

async function loadNewArrivals() {
  const { data, meta } = await serverFetchWithMeta<ProductCardItem[]>(
    "/search?sort=newest&limit=5",
    { next: { revalidate: 120 } },
  );
  return {
    items: data ?? [],
    totalCount: meta?.resultCount ?? null,
  };
}

export default async function HomePage() {
  const [categories, arrivals] = await Promise.all([
    loadCategories(),
    loadNewArrivals(),
  ]);

  return (
    <div className="flex flex-col">
      <HomeHero />

      <div className="mt-10 flex flex-col gap-12 md:mt-14 md:gap-16 pb-4">
        <ShopByCategory categories={categories} />
        <NewArrivals items={arrivals.items} totalCount={arrivals.totalCount} />
        <ClosetWorthBanner />
      </div>
    </div>
  );
}
