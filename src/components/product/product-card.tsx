"use client";

import type { ProductCardItem } from "@repose/api-types";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ConditionBadge } from "./condition-badge";
import { PriceTag } from "./price-tag";
import { RareFindBadge, SoldOverlay } from "./badges";
import { cn } from "@/lib/utils";

type Props = {
  item: ProductCardItem;
  onSave?: (id: string) => void;
  saved?: boolean;
  className?: string;
};

export function ProductCard({ item, onSave, saved, className }: Props) {
  const sold = item.status === "SOLD";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-card border border-card-border bg-surface shadow-card",
        className,
      )}
    >
      <Link href={`/listing/${item.id}`} className="block">
        <div className="relative aspect-[4/5] w-full bg-accent-soft">
          {item.mainImageUrl ? (
            <Image
              src={item.mainImageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 50vw, 240px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              No photo
            </div>
          )}
          {sold ? <SoldOverlay /> : null}
          {item.isFeatured && !sold ? (
            <div className="absolute left-2 top-2">
              <RareFindBadge />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">
            {item.title || "Untitled"}
          </h3>
          <PriceTag priceAed={item.priceAed} className="text-base font-bold" />
          <ConditionBadge condition={item.condition} />
        </div>
      </Link>
      {onSave && !sold ? (
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save listing"}
          onClick={(e) => {
            e.preventDefault();
            onSave(item.id);
          }}
          className={cn(
            "absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface/95 text-primary shadow-card",
            saved && "animate-heart",
          )}
        >
          <Heart
            className={cn("h-5 w-5", saved && "fill-primary")}
            strokeWidth={1.75}
          />
        </button>
      ) : null}
    </article>
  );
}
