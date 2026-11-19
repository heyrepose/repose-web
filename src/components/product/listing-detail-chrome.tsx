"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ListingSaveHeart } from "@/components/product/listing-save-heart";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initiallySaved?: boolean;
  className?: string;
};

/** Back + wishlist row — matches mobile PDP chrome (no purple accents). */
export function ListingDetailChrome({
  listingId,
  initiallySaved = false,
  className,
}: Props) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Go back"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/search");
          }
        }}
        className="flex h-11 w-11 items-center justify-center rounded-full text-text transition-colors hover:bg-accent-soft"
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={1.75} />
      </button>
      <ListingSaveHeart
        listingId={listingId}
        initiallySaved={initiallySaved}
      />
    </div>
  );
}
