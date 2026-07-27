"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetchWithMeta } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
    fullName: string;
  };
};

type Meta = {
  nextCursor: string | null;
  averageRating: string;
  reviewCount: number;
  starCounts: Record<string, number>;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-primary" aria-label={`${rating} stars`}>
      {"★★★★★".slice(0, rating)}
      <span className="text-card-border">{"★★★★★".slice(rating)}</span>
    </span>
  );
}

export function SellerReviews({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["users", userId, "reviews"],
    queryFn: () =>
      apiFetchWithMeta<Review[]>(`/users/${userId}/reviews?limit=20`),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const reviews = data?.data ?? [];
  const meta = (data?.meta ?? {}) as Meta;
  const total = meta.reviewCount ?? 0;
  const avg = Number(meta.averageRating ?? 0);

  if (!total && !reviews.length) {
    return (
      <p className="rounded-card border border-card-border bg-surface p-4 text-sm text-muted">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-card-border bg-surface p-4 shadow-card">
        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold text-primary">{avg.toFixed(1)}</p>
          <div className="pb-1">
            <Stars rating={Math.round(avg)} />
            <p className="text-xs text-muted">{total} reviews</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = meta.starCounts?.[String(star)] ?? 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <li key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-soft">
                  <div
                    className={cn("h-full rounded-full bg-primary")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted">{count}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="flex flex-col gap-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-card border border-card-border bg-surface p-4 shadow-card"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-xs font-semibold text-primary">
                {r.reviewer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.reviewer.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (r.reviewer.username ?? r.reviewer.fullName).slice(0, 1)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  @{r.reviewer.username ?? "buyer"}
                </p>
                <Stars rating={r.rating} />
              </div>
              <span className="text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            {r.comment ? (
              <p className="mt-2 text-sm text-text/90">{r.comment}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
