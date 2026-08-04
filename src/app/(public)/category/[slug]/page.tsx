import type { Metadata } from "next";
import { Suspense } from "react";
import type { ProductCardItem } from "@repose/api-types";
import { ProductGrid } from "@/components/product/product-grid";
import { CategoryFilters } from "@/components/filters/category-filters";
import { serverFetch } from "@/lib/api-client";
import { categoryIcon } from "@/lib/category-icons";

export const revalidate = 120;

type Category = {
  id: string;
  name: string;
  slug: string;
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
  const Icon = categoryIcon(params.slug);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start gap-4 border-b border-card-border pb-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-accent-soft text-primary">
          <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold md:text-3xl">
            {category?.name ?? params.slug}
          </h1>
          {category?.description ? (
            <p className="mt-1 max-w-lg text-sm text-muted">
              {category.description}
            </p>
          ) : null}
          {catError ? (
            <p className="mt-2 text-sm text-muted">
              Category details unavailable.
            </p>
          ) : null}
        </div>
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
