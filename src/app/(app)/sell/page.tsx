"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductCardItem } from "@repose/api-types";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { categoryIcon } from "@/lib/category-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; isActive?: boolean };

type DraftItem = ProductCardItem & { status?: string };

function continueHref(item: DraftItem): string {
  // Flow: category → details → condition-price → photos → checkout (review & publish)
  if (!item.title) return `/sell/${item.id}/details`;
  if (!item.priceAed || !item.condition) {
    return `/sell/${item.id}/condition-price`;
  }
  if (!item.mainImageUrl) return `/sell/${item.id}/photos`;
  return `/sell/${item.id}/checkout`;
}

export default function SellStartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories", { skipAuth: true }),
  });

  const { data: drafts } = useQuery({
    queryKey: ["my-listings", "DRAFT"],
    queryFn: () =>
      apiFetch<DraftItem[]>("/users/me/listings?status=DRAFT&limit=5"),
  });

  async function startDraft() {
    if (!selected) {
      setError("Pick a category to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const listing = await apiFetch<{ id: string }>("/listings", {
        method: "POST",
        body: JSON.stringify({ categoryId: selected }),
      });
      router.push(`/sell/${listing.id}/details`);
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not start listing.");
      setError(message);
      toast("Could not start listing.", "error", e);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Sell an item</h1>
      <p className="mt-1 text-sm text-muted">
        Step 1 of 5 — pick a category, then details, price, photos, and
        publish.
      </p>

      {(drafts ?? []).length > 0 ? (
        <div className="mt-4 rounded-card border border-card-border bg-accent-soft/40 p-4">
          <p className="text-sm font-semibold text-primary">
            You have {(drafts ?? []).length} unfinished draft
            {(drafts ?? []).length === 1 ? "" : "s"}
          </p>
          <ul className="mt-3 space-y-2">
            {(drafts ?? []).slice(0, 3).map((d) => (
              <li key={d.id}>
                <Link
                  href={continueHref(d)}
                  className="block rounded-card border border-card-border bg-surface px-3 py-2 text-sm font-medium"
                >
                  Continue · {d.title || "Untitled draft"}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/profile/listings"
            className="mt-3 inline-block text-xs font-medium text-primary underline"
          >
            View all drafts
          </Link>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {(categories ?? [])
            .filter((c) => c.slug !== "kids")
            .map((c) => {
              const Icon = categoryIcon(c.slug);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c.id)}
                    className={cn(
                      "flex min-h-[52px] w-full items-center gap-3 rounded-card border px-4 text-left text-sm font-medium",
                      selected === c.id
                        ? "border-primary bg-accent-soft text-primary"
                        : "border-card-border bg-surface",
                    )}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {c.name}
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}

      <Button
        className="mt-6 w-full"
        disabled={submitting || !selected}
        onClick={startDraft}
      >
        {submitting ? <Spinner className="h-4 w-4" /> : null}
        Start new listing
      </Button>
    </div>
  );
}
