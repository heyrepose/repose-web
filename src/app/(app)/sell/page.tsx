"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

type Category = { id: string; name: string; slug: string; isActive?: boolean };

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
      router.push(`/sell/${listing.id}/photos`);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Could not start listing.";
      setError(message);
      toast(message, "error");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Sell an item</h1>
      <p className="mt-1 text-sm text-muted">
        Step 1 of 3 — pick a category. Photos, condition, and price come next.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {(categories ?? [])
            .filter((c) => c.slug !== "kids")
            .map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelected(c.id)}
                className={`flex min-h-[52px] w-full items-center rounded-card border px-4 text-left text-sm font-medium ${
                  selected === c.id
                    ? "border-primary bg-accent-soft text-primary"
                    : "border-card-border bg-surface"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}

      <Button
        className="mt-6 w-full"
        disabled={submitting || !selected}
        onClick={startDraft}
      >
        {submitting ? <Spinner className="h-4 w-4" /> : null}
        Continue
      </Button>
    </div>
  );
}
