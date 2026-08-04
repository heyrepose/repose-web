"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Props = {
  listingId: string;
  status: string;
};

export function OwnerListingActions({ listingId, status }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);

  const unpublish = useMutation({
    mutationFn: () =>
      apiFetch(`/listings/${listingId}/unpublish`, { method: "PATCH" }),
    onSuccess: () => {
      setUnpublishOpen(false);
      toast("Listing unpublished", "success");
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      router.refresh();
      router.push("/profile/listings");
    },
    onError: (e) =>
      toast("Could not unpublish", "error", e),
  });

  const remove = useMutation({
    mutationFn: () =>
      apiFetch(`/listings/${listingId}`, { method: "DELETE" }),
    onSuccess: () => {
      setRemoveOpen(false);
      toast("Listing removed", "success");
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      router.push("/profile/listings");
    },
    onError: (e) =>
      toast("Could not remove", "error", e),
  });

  const relist = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(`/listings/${listingId}/relist`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      toast("Draft created from this listing", "success");
      void qc.invalidateQueries({ queryKey: ["my-listings"] });
      router.push(`/sell/${data.id}/edit`);
    },
    onError: (e) =>
      toast("Could not relist", "error", e),
  });

  if (status === "SOLD" || status === "REMOVED") {
    return (
      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          disabled={relist.isPending}
          onClick={() => relist.mutate()}
        >
          Relist as new draft
        </Button>
        {status === "SOLD" ? (
          <p className="text-center text-xs text-muted">
            Copies photos and details into a fresh draft — the sold record stays
            in your history.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Link href={`/sell/${listingId}/edit`}>
        <Button className="w-full">Edit listing</Button>
      </Link>
      {status === "DRAFT" ? (
        <Link href={`/sell/${listingId}/condition-price`}>
          <Button variant="outline" className="w-full">
            Publish
          </Button>
        </Link>
      ) : null}
      {status === "ACTIVE" ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setUnpublishOpen(true)}
        >
          Unpublish
        </Button>
      ) : null}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setRemoveOpen(true)}
      >
        Remove listing
      </Button>

      <ConfirmDialog
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        onConfirm={() => unpublish.mutate()}
        title="Unpublish listing?"
        description="It will move back to drafts and leave search until you publish again."
        confirmLabel="Unpublish"
        busy={unpublish.isPending}
      />
      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => remove.mutate()}
        title="Remove listing?"
        description="This cannot be undone. Buyers will no longer see this item."
        confirmLabel="Remove"
        destructive
        busy={remove.isPending}
      />
    </div>
  );
}
