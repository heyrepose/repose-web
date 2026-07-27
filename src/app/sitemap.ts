import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/api-client";
import type { ProductCardItem } from "@repose/api-types";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4001";

type Category = { slug: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: categories }, { data: listings }] = await Promise.all([
    serverFetch<Category[]>("/categories", { next: { revalidate: 3600 } }),
    serverFetch<ProductCardItem[]>("/search?sort=newest&limit=100", {
      next: { revalidate: 600 },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/search`, changeFrequency: "hourly", priority: 0.8 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
    .filter((c) => c.slug !== "kids")
    .map((c) => ({
      url: `${SITE}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${SITE}/listing/${l.id}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...listingRoutes];
}
