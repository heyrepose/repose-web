import Image from "next/image";
import Link from "next/link";
import { categoryIcon } from "@/lib/category-icons";

export type HomeCategoryCard = {
  name: string;
  slug: string;
  listingCount: number;
  imageUrl: string | null;
};

function formatCount(n: number) {
  return n.toLocaleString("en-US");
}

export function ShopByCategory({ categories }: { categories: HomeCategoryCard[] }) {
  if (!categories.length) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-6">
        <h2 className="text-xl font-bold text-primary md:text-2xl">
          Shop by category
        </h2>
        <Link
          href="/search"
          className="shrink-0 text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
        >
          All categories
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
        {categories.map((cat) => {
          const Icon = categoryIcon(cat.slug);
          return (
            <li key={cat.slug}>
              <Link
                href={`/category/${cat.slug}`}
                className="group flex flex-col gap-2.5"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#e4ddd0]">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 45vw, 18vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/40">
                      <Icon className="h-12 w-12" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary md:text-[15px]">
                    {cat.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted md:text-[13px]">
                    {formatCount(cat.listingCount)} listings
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
