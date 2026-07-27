import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import type { ProductCardItem } from "@repose/api-types";
import { ProductGrid } from "@/components/product/product-grid";
import { CategoryFilters } from "@/components/filters/category-filters";
import { serverFetch } from "@/lib/api-client";

export const revalidate = 120;

type Category = {
  id: string;
  name: string;
  slug: string;
  bannerUrl?: string | null;
  description?: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data } = await serverFetch<Category>(`/categories/${params.slug}`, {
    next: { revalidate: 120 },
  });
  return {
    title: data?.name ?? params.slug,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: {
    sort?: string;
    brand?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
  };
}) {
  const sort = searchParams?.sort ?? "newest";
  const qs = new URLSearchParams({
    category: params.slug,
    sort,
    limit: "40",
  });
  if (searchParams?.brand) qs.set("brand", searchParams.brand);
  if (searchParams?.size) qs.set("size", searchParams.size);
  if (searchParams?.minPrice) qs.set("minPrice", searchParams.minPrice);
  if (searchParams?.maxPrice) qs.set("maxPrice", searchParams.maxPrice);
  if (searchParams?.condition) qs.set("condition", searchParams.condition);

  const [{ data: category, error: catError }, search] = await Promise.all([
    serverFetch<Category>(`/categories/${params.slug}`, {
      next: { revalidate: 120 },
    }),
    serverFetch<ProductCardItem[]>(`/search?${qs.toString()}`, {
      next: { revalidate: 120 },
    }),
  ]);

  const listings = search.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="relative -mx-screen overflow-hidden md:mx-0 md:rounded-card">
        <div className="relative aspect-[21/9] min-h-[140px] w-full bg-primary">
          {category?.bannerUrl ? (
            <Image
              src={category.bannerUrl}
              alt={category.name}
              fill
              priority
              className="object-cover opacity-80"
              sizes="100vw"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-text/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-screen py-5 text-surface md:px-6">
            <h1 className="text-2xl font-semibold md:text-3xl">
              {category?.name ?? params.slug}
            </h1>
            {category?.description ? (
              <p className="mt-1 max-w-lg text-sm text-surface/85">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
        {catError ? (
          <p className="mt-2 px-screen text-sm text-muted md:px-0">
            Category details unavailable.
          </p>
        ) : null}
      </header>

      <Suspense fallback={null}>
        <CategoryFilters slug={params.slug} />
      </Suspense>

      <ProductGrid
        items={listings}
        emptyTitle="No listings yet"
        emptyMessage={
          search.error
            ? "Could not load listings for this category."
            : "Be the first to sell in this category."
        }
      />
    </div>
  );
}
