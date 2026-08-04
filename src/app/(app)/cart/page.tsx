"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useCart, type CartResponse } from "@/lib/cart";
import { formatAed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingRail } from "@/components/product/recommendation-rails";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { data: cart, isLoading, error } = useCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [removeId, setRemoveId] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: (listingId: string) =>
      apiFetch(`/cart/items/${listingId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setRemoveId(null);
      toast("Removed from bag", "success");
    },
    onError: (e) =>
      toast("Could not remove item", "error", e),
  });

  const move = useMutation({
    mutationFn: (listingId: string) =>
      apiFetch<CartResponse>(`/cart/items/${listingId}/move-to-saved`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast("Moved to saved", "success");
    },
    onError: (e) =>
      toast("Could not move item", "error", e),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted">Could not load your bag.</p>;
  }

  const empty = !cart || cart.itemCount === 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Bag</h1>
        {!empty ? (
          <p className="mt-1 text-sm text-muted">
            {cart.availableCount} available · {cart.itemCount} total
          </p>
        ) : null}
      </header>

      {empty ? (
        <>
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8 text-primary" />}
            title="Your bag is empty"
            description="Save pieces you love, or browse curated closets."
            action={
              <Link
                href="/search"
                className="inline-flex min-h-[52px] items-center justify-center rounded-pill bg-primary px-6 text-sm font-medium text-surface"
              >
                Start browsing
              </Link>
            }
          />
          <TrendingRail title="Inspired for you" />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {cart.groups.map((group) => (
              <section key={group.seller.id} className="flex flex-col gap-3">
                <Link
                  href={
                    group.seller.username
                      ? `/seller/${group.seller.username}`
                      : "#"
                  }
                  className="text-sm font-semibold text-primary"
                >
                  @{group.seller.username ?? "seller"}
                </Link>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item.listingId}
                      className={
                        "flex gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card " +
                        (!item.isAvailable ? "opacity-60" : "")
                      }
                    >
                      <Link
                        href={`/listing/${item.listingId}`}
                        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-card bg-accent-soft"
                      >
                        {item.listing.mainImageUrl ? (
                          <Image
                            src={item.listing.mainImageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/listing/${item.listingId}`}
                          className="line-clamp-2 text-sm font-medium"
                        >
                          {item.listing.title ?? "Listing"}
                        </Link>
                        <p className="mt-1 text-sm font-semibold">
                          {formatAed(item.listing.priceAed ?? "0")}
                        </p>
                        {!item.isAvailable ? (
                          <p className="mt-1 text-xs text-muted">
                            No longer available
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-xs text-muted underline"
                            disabled={remove.isPending}
                            onClick={() => setRemoveId(item.listingId)}
                          >
                            Remove
                          </button>
                          {item.isAvailable ? (
                            <button
                              type="button"
                              className="text-xs text-primary underline"
                              disabled={move.isPending}
                              onClick={() => move.mutate(item.listingId)}
                            >
                              Save for later
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="sticky bottom-20 rounded-card border border-card-border bg-surface p-4 shadow-card md:bottom-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-bold">{formatAed(cart.subtotalAed)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Unavailable items are excluded from checkout.
            </p>
            {cart.availableCount >= 1 ? (
              <Link
                href="/checkout?from=cart"
                className="mt-3 inline-flex w-full min-h-[52px] items-center justify-center rounded-pill bg-primary px-6 text-sm font-medium text-surface"
              >
                Checkout
              </Link>
            ) : (
              <Button className="mt-3 w-full" disabled>
                Nothing available to checkout
              </Button>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) remove.mutate(removeId);
        }}
        title="Remove from bag?"
        description="This item will be removed from your shopping bag."
        confirmLabel="Remove"
        destructive
        busy={remove.isPending}
      />
    </div>
  );
}
