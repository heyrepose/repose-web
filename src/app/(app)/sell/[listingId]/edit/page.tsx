"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ListingCondition } from "@repose/api-types";
import { CONDITION_BADGE } from "@repose/ui";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Camera, Star } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CONDITIONS = Object.keys(CONDITION_BADGE) as ListingCondition[];
const MAX = 5;

const schema = z.object({
  title: z.string().min(3).max(80),
  brand: z.string().max(40).optional().or(z.literal("")),
  size: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
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
  title?: string | null;
  brand?: string | null;
  size?: string | null;
  description?: string | null;
  condition?: ListingCondition | null;
  priceAed?: string | null;
  status: string;
  images: Array<{ url: string; sortOrder: number }>;
};

type Slot = { file?: File; preview: string; existingUrl?: string } | null;

type UploadUrl = {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
};

async function uploadToCloudinary(file: File, signed: UploadUrl): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);
  form.append("public_id", signed.publicId);
  const cloudRes = await fetch(signed.uploadUrl, { method: "POST", body: form });
  const cloudJson = (await cloudRes.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!cloudRes.ok || !cloudJson.secure_url) {
    throw new Error(cloudJson.error?.message ?? "Upload failed");
  }
  return cloudJson.secure_url;
}

export default function EditListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>(Array(MAX).fill(null));
  const [mainIndex, setMainIndex] = useState(0);
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydratedPhotos, setHydratedPhotos] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => apiFetch<ListingDetail>(`/listings/${listingId}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const condition = watch("condition");

  useEffect(() => {
    if (!listing) return;
    reset({
      title: listing.title ?? "",
      brand: listing.brand ?? "",
      size: listing.size ?? "",
      description: listing.description ?? "",
      condition: listing.condition ?? "VERY_GOOD",
      priceAed: listing.priceAed ?? "",
    });
    if (!hydratedPhotos) {
      const next: Slot[] = Array(MAX).fill(null);
      const sorted = [...(listing.images ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      sorted.slice(0, MAX).forEach((img, i) => {
        next[i] = { preview: img.url, existingUrl: img.url };
      });
      setSlots(next);
      setMainIndex(0);
      setHydratedPhotos(true);
    }
  }, [listing, reset, hydratedPhotos]);

  function onPick(fileList: FileList | null) {
    if (!fileList?.length) return;
    const file = fileList[0];
    const preview = URL.createObjectURL(file);
    setSlots((prev) => {
      const next = [...prev];
      const idx =
        pickSlot != null && next[pickSlot] == null
          ? pickSlot
          : next.findIndex((s) => s == null);
      if (idx < 0) return prev;
      next[idx] = { file, preview };
      return next;
    });
    setPickSlot(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearSlot(i: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = null;
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    const filled = slots.filter(Boolean);
    if (filled.length < 1) {
      toast("Add at least one photo", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/listings/${listingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          brand: values.brand || undefined,
          size: values.size || undefined,
          description: values.description || undefined,
          condition: values.condition,
          priceAed: values.priceAed,
        }),
      });

      const ordered = slots
        .map((s, i) => ({ s, i }))
        .filter((x) => x.s)
        .sort((a, b) => {
          if (a.i === mainIndex) return -1;
          if (b.i === mainIndex) return 1;
          return a.i - b.i;
        });

      const images: Array<{ url: string; sortOrder: number }> = [];
      for (let i = 0; i < ordered.length; i++) {
        const slot = ordered[i].s!;
        if (slot.existingUrl && !slot.file) {
          images.push({ url: slot.existingUrl, sortOrder: i });
        } else if (slot.file) {
          const signed = await apiFetch<UploadUrl>(
            `/listings/${listingId}/photos/upload-url`,
            { method: "POST" },
          );
          const url = await uploadToCloudinary(slot.file, signed);
          images.push({ url, sortOrder: i });
        }
      }

      await apiFetch(`/listings/${listingId}/photos`, {
        method: "POST",
        body: JSON.stringify({ images }),
      });

      toast("Listing updated", "success");
      router.push(`/listing/${listingId}`);
    } catch (e) {
      toast("Could not save listing", "error", e);
      setBusy(false);
    }
  }

  if (isLoading || !listing) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (listing.status !== "ACTIVE" && listing.status !== "DRAFT") {
    return (
      <p className="text-sm text-muted">
        This listing can&apos;t be edited in its current state.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Edit listing</h1>
      <p className="mt-1 text-sm text-muted">
        Update photos, details, condition, and price.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-5"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
        <div className="grid grid-cols-3 gap-3">
          {slots.map((slot, i) => (
            <div key={i} className="relative aspect-[4/5]">
              {slot ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.preview}
                    alt=""
                    className="h-full w-full rounded-card border border-card-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Set as main"
                    onClick={() => setMainIndex(i)}
                    className={cn(
                      "absolute left-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/95",
                      mainIndex === i ? "text-primary" : "text-muted",
                    )}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={mainIndex === i ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => clearSlot(i)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-text/70 px-2 py-0.5 text-[10px] font-medium text-surface"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPickSlot(i);
                    inputRef.current?.click();
                  }}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-card-border bg-surface text-muted"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <Input label="Title" error={errors.title?.message} {...register("title")} />
        <Input label="Brand (optional)" {...register("brand")} />
        <Input label="Size (optional)" {...register("size")} />
        <Textarea label="Description (optional)" {...register("description")} />

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
        </fieldset>

        <Input
          label="Price (AED)"
          error={errors.priceAed?.message}
          {...register("priceAed")}
        />

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Spinner className="h-4 w-4" /> : null}
          Save changes
        </Button>
        {listing.status === "DRAFT" ? (
          <Link href={`/sell/${listingId}/condition-price`} className="w-full">
            <Button type="button" variant="outline" className="w-full">
              Continue to publish
            </Button>
          </Link>
        ) : null}
      </form>
    </div>
  );
}
