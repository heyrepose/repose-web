"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function LeaveReview({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${orderId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      }),
    onSuccess: () => {
      setDone(true);
      toast("Thanks for your review", "success");
      void qc.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (e) =>
      toast("Could not submit review", "error", e),
  });

  if (done) {
    return (
      <p className="rounded-card border border-card-border bg-accent-soft/40 p-4 text-sm text-primary">
        Review submitted — thank you.
      </p>
    );
  }

  return (
    <div className="rounded-card border border-card-border bg-surface p-4 shadow-card">
      <h3 className="text-sm font-semibold">Rate the seller</h3>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
            onClick={() => setRating(n)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <Star
              className={cn(
                "h-6 w-6",
                n <= rating ? "fill-primary text-primary" : "text-muted",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment…"
        rows={3}
        className="mt-3 w-full rounded-card border border-card-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <Button
        className="mt-3 w-full"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Submit review
      </Button>
    </div>
  );
}
