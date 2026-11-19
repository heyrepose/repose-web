"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductCardItem } from "@repose/api-types";
import { Package, Plus, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatAed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";

type InventoryItem = ProductCardItem & {
  status?: string;
  viewCount?: number;
};

function continueHref(item: InventoryItem): string {
  // Flow: details → condition-price → photos → checkout
  if (!item.title) return `/sell/${item.id}/details`;
  if (!item.priceAed || !item.condition) {
    return `/sell/${item.id}/condition-price`;
  }
  if (!item.mainImageUrl) return `/sell/${item.id}/photos`;
  return `/sell/${item.id}/checkout`;
}

export default function MyListingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"ACTIVE" | "SOLD" | "DRAFT">("ACTIVE");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [unpublishId, setUnpublishId] = useState<string | null>(null);
  const [priceItem, setPriceItem] = useState<InventoryItem | null>(null);
  const [priceAed, setPriceAed] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-listings", status],
    queryFn: () =>
      apiFetch<InventoryItem[]>(
        `/users/me/listings?status=${status}&limit=40`,
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/listings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setRemoveId(null);
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast("Listing removed", "success");
    },
    onError: (e) =>
      toast("Could not remove", "error", e),
  });

  const unpublish = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/listings/${id}/unpublish`, { method: "PATCH" }),
    onSuccess: () => {
      setUnpublishId(null);
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast("Listing unpublished — publish again when ready", "success");
    },
    onError: (e) =>
      toast("Could not unpublish", "error", e),
  });

  const updatePrice = useMutation({
    mutationFn: () =>
      apiFetch(`/listings/${priceItem!.id}`, {
        method: "PATCH",
        body: JSON.stringify({ priceAed }),
      }),
    onSuccess: () => {
      setPriceItem(null);
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast("Price updated", "success");
    },
    onError: (e) =>
      toast("Could not update price", "error", e),
  });

  const relist = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/listings/${id}/relist`, { method: "POST" }),
    onSuccess: (data) => {
      toast("Draft created", "success");
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      window.location.href = `/sell/${data.id}/edit`;
    },
    onError: (e) =>
      toast("Could not relist", "error", e),
  });

  async function shareItem(item: InventoryItem) {
    const url = `${window.location.origin}/listing/${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title ?? "Repose listing",
          url,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied", "success");
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My listings</h1>
        <Link href="/sell">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            List new
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {(["ACTIVE", "SOLD", "DRAFT"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "primary" : "outline"}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-muted">Could not load listings.</p>
      ) : !(data ?? []).length ? (
        <EmptyState
          title="Nothing here"
          description={
            status === "DRAFT"
              ? "Start a listing — unfinished drafts show up here."
              : "List something from your closet."
          }
          icon={<Package className="h-6 w-6" />}
          action={
            <Link href="/sell">
              <Button>Sell an item</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {(data ?? []).map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-card border border-card-border bg-surface shadow-card"
            >
              <div className="flex gap-3 p-3">
                <Link
                  href={
                    status === "DRAFT"
                      ? continueHref(item)
                      : `/listing/${item.id}`
                  }
                  className="relative h-24 w-20 shrink-0 overflow-hidden rounded-card bg-accent-soft"
                >
                  {item.mainImageUrl ? (
                    <Image
                      src={item.mainImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {item.title || "Untitled draft"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {item.priceAed ? (
                      <span className="text-sm font-bold text-primary">
                        {formatAed(item.priceAed)}
                      </span>
                    ) : null}
                    {typeof item.viewCount === "number" ? (
                      <span>{item.viewCount} views</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {status === "DRAFT" ? (
                      <>
                        <Link href={continueHref(item)}>
                          <Button size="sm">Continue</Button>
                        </Link>
                        {item.mainImageUrl && item.title && item.priceAed ? (
                          <Link href={`/sell/${item.id}/condition-price`}>
                            <Button size="sm" variant="outline">
                              Publish
                            </Button>
                          </Link>
                        ) : null}
                      </>
                    ) : null}
                    {status === "ACTIVE" ? (
                      <>
                        <Link href={`/sell/${item.id}/edit`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPriceItem(item);
                            setPriceAed(item.priceAed ?? "");
                          }}
                        >
                          Price
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void shareItem(item)}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnpublishId(item.id)}
                        >
                          Unpublish
                        </Button>
                      </>
                    ) : null}
                    {status === "SOLD" ? (
                      <Button
                        size="sm"
                        disabled={relist.isPending}
                        onClick={() => relist.mutate(item.id)}
                      >
                        Relist
                      </Button>
                    ) : null}
                    {status !== "SOLD" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRemoveId(item.id)}
                      >
                        Delete
                      </Button>
                    ) : (
                      <Link href={`/listing/${item.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removeId)}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) remove.mutate(removeId);
        }}
        title="Delete listing?"
        description="This removes the listing from your closet."
        confirmLabel="Delete"
        destructive
        busy={remove.isPending}
      />
      <ConfirmDialog
        open={Boolean(unpublishId)}
        onClose={() => setUnpublishId(null)}
        onConfirm={() => {
          if (unpublishId) unpublish.mutate(unpublishId);
        }}
        title="Unpublish listing?"
        description="It moves to Drafts. Open it and tap Publish when you want it live again."
        confirmLabel="Unpublish"
        busy={unpublish.isPending}
      />

      <Sheet
        open={Boolean(priceItem)}
        onClose={() => setPriceItem(null)}
        title="Update price"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Price (AED)"
            value={priceAed}
            onChange={(e) => setPriceAed(e.target.value)}
          />
          <Button
            disabled={updatePrice.isPending || !priceAed}
            onClick={() => updatePrice.mutate()}
          >
            {updatePrice.isPending ? <Spinner className="h-4 w-4" /> : null}
            Save price
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
