import Image from "next/image";
import Link from "next/link";
import type { ListingCondition, ProductCardItem } from "@repose/api-types";
import { Star } from "lucide-react";
import { cn, formatAed } from "@/lib/utils";

const CONDITION_PILL: Partial<
  Record<ListingCondition | string, { label: string; className: string }>
> = {
  NEW_WITH_TAGS: {
    label: "NEW W/ TAGS",
    className: "bg-[#d6e4da] text-primary",
  },
  NEW_WITHOUT_TAGS: {
    label: "NEW",
    className: "bg-[#d6e4da] text-primary",
  },
  VERY_GOOD: {
    label: "VERY GOOD",
    className: "bg-surface text-text",
  },
  GOOD: {
    label: "GOOD",
    className: "bg-surface text-text",
  },
  SATISFACTORY: {
    label: "SATISFACTORY",
    className: "bg-surface text-text",
  },
};

function priceLabel(priceAed: string) {
  const formatted = formatAed(priceAed).replace(/^AED\s*/i, "");
  const whole = formatted.replace(/\.00$/, "");
  return `${whole} AED`;
}

export function NewArrivals({
  items,
  totalCount,
}: {
  items: ProductCardItem[];
  totalCount?: number | null;
}) {
  const viewAllLabel =
    totalCount != null && totalCount > 0
      ? `View all ${totalCount.toLocaleString("en-US")}`
      : "View all";

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#a89070]">
            Added in the last 24 hours
          </p>
          <h2 className="mt-1 text-xl font-bold text-primary md:text-2xl">
            New Arrivals
          </h2>
        </div>
        {items.length > 0 ? (
          <Link
            href="/search?filter=new-arrivals&sort=newest"
            className="shrink-0 text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-[14px] bg-[#e4ddd0]/60 px-5 py-10 text-center text-sm text-muted">
          No new arrivals
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {items.map((item) => {
            const pill =
              CONDITION_PILL[item.condition] ?? CONDITION_PILL.GOOD;
            return (
              <li key={item.id}>
                <Link
                  href={`/listing/${item.id}`}
                  className="group flex flex-col gap-2.5"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#e4ddd0]">
                    {item.mainImageUrl ? (
                      <Image
                        src={item.mainImageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 45vw, 18vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">
                        No photo
                      </div>
                    )}

                    {pill ? (
                      <span
                        className={cn(
                          "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                          pill.className,
                        )}
                      >
                        {pill.label}
                      </span>
                    ) : null}

                    {item.isFeatured ? (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-0.5 rounded-md bg-text/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="h-2.5 w-2.5 fill-white" />
                        Rare
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {item.brand ? (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a89070]">
                        {item.brand}
                      </p>
                    ) : null}
                    <p className="line-clamp-1 text-sm font-medium text-primary">
                      {item.title || "Untitled"}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {priceLabel(item.priceAed)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
