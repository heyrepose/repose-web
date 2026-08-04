"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ListingCondition } from "@repose/api-types";
import { CONDITION_BADGE } from "@repose/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check } from "lucide-react";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CONDITIONS = Object.keys(CONDITION_BADGE) as ListingCondition[];

const schema = z.object({
  condition: z.enum([
    "NEW_WITH_TAGS",
    "NEW_WITHOUT_TAGS",
    "VERY_GOOD",
    "GOOD",
    "SATISFACTORY",
  ]),
  priceAed: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount"),
});

type FormValues = z.infer<typeof schema>;

type ListingDetail = {
  id: string;
  status: string;
  condition?: ListingCondition | null;
  priceAed?: string | null;
};

export default function SellConditionPricePage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { toast } = useToast();
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => apiFetch<ListingDetail>(`/listings/${listingId}`),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { condition: "VERY_GOOD" },
  });

  useEffect(() => {
    if (listing) {
      reset({
        condition: listing.condition ?? "VERY_GOOD",
        priceAed: listing.priceAed ?? "",
      });
      if (listing.status === "ACTIVE") {
        setPublishedId(listing.id);
      }
    }
  }, [listing, reset]);

  const condition = watch("condition");

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      if (listing?.status === "ACTIVE") {
        await apiFetch(`/listings/${listingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            condition: values.condition,
            priceAed: values.priceAed,
          }),
        });
        setPublishedId(listingId);
        toast("Listing updated", "success");
        return;
      }

      const data = await apiFetch<{ id: string; status: string }>(
        `/listings/${listingId}/publish`,
        {
          method: "PATCH",
          body: JSON.stringify({
            condition: values.condition,
            priceAed: values.priceAed,
          }),
        },
      );
      setPublishedId(data.id);
      toast("Listing published", "success");
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not publish listing.");
      setFormError(message);
      toast("Could not publish listing.", "error", e);
    }
  }

  async function shareListing() {
    const url = `${window.location.origin}/listing/${publishedId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Repose listing", url });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied", "success");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (publishedId) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-8 text-center animate-scale-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Listing is live</h1>
          <p className="mt-2 text-sm text-muted">
            Share your piece — buyers can find it in search and the feed.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link href={`/listing/${publishedId}`} className="w-full">
            <Button className="w-full">View listing</Button>
          </Link>
          <Link href={`/sell/${listingId}/edit`} className="w-full">
            <Button variant="outline" className="w-full">
              Edit listing
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={shareListing}>
            Share link
          </Button>
          <Link href="/sell" className="w-full">
            <Button variant="ghost" className="w-full">
              List another item
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Condition & price</h1>
      <p className="mt-1 text-sm text-muted">
        Last step — then you&apos;re published.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-5"
      >
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Condition</legend>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue("condition", c)}
                className={cn(
                  "shrink-0 rounded-pill px-4 py-2.5 text-sm font-medium",
                  condition === c
                    ? "bg-primary text-surface"
                    : "border border-card-border bg-surface text-muted",
                )}
              >
                {CONDITION_BADGE[c].label}
              </button>
            ))}
          </div>
          <input type="hidden" {...register("condition")} />
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Price</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
              AED
            </span>
            <input
              inputMode="decimal"
              placeholder="149.50"
              className={cn(
                "min-h-[56px] w-full rounded-card border border-card-border bg-surface pl-14 pr-3 text-2xl font-bold outline-none focus:border-primary",
                errors.priceAed && "border-text",
              )}
              {...register("priceAed")}
            />
          </div>
          {errors.priceAed ? (
            <span className="text-xs text-muted">{errors.priceAed.message}</span>
          ) : null}
        </label>

        {formError ? <p className="text-sm text-muted">{formError}</p> : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Publish listing
        </Button>
      </form>
    </div>
  );
}
