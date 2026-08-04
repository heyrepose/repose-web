"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  title: z.string().min(3).max(80),
  brand: z.string().max(40).optional().or(z.literal("")),
  size: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type ListingDetail = {
  title?: string | null;
  brand?: string | null;
  size?: string | null;
  description?: string | null;
};

export default function SellDetailsPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => apiFetch<ListingDetail>(`/listings/${listingId}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (listing) {
      reset({
        title: listing.title ?? "",
        brand: listing.brand ?? "",
        size: listing.size ?? "",
        description: listing.description ?? "",
      });
    }
  }, [listing, reset]);

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await apiFetch(`/listings/${listingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          brand: values.brand || undefined,
          size: values.size || undefined,
          description: values.description || undefined,
        }),
      });
      router.push(`/sell/${listingId}/condition-price`);
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not save details.");
      setFormError(message);
      toast("Could not save details.", "error", e);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Details</h1>
      <p className="mt-1 text-sm text-muted">
        Title is required. Brand and description are optional.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Title"
          error={errors.title?.message}
          {...register("title")}
        />
        <Input
          label="Brand (optional)"
          error={errors.brand?.message}
          {...register("brand")}
        />
        <Input
          label="Size (optional)"
          error={errors.size?.message}
          {...register("size")}
        />
        <Textarea
          label="Description (optional)"
          error={errors.description?.message}
          {...register("description")}
        />
        {formError ? <p className="text-sm text-muted">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Continue
        </Button>
      </form>
    </div>
  );
}
