"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, Star } from "lucide-react";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type UploadUrl = {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  error?: { message?: string };
};

type Slot = { file?: File; preview: string; existingUrl?: string } | null;

type ListingDetail = {
  images: Array<{ url: string; sortOrder: number }>;
};

async function uploadToCloudinary(
  file: File,
  signed: UploadUrl,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);
  form.append("public_id", signed.publicId);

  const cloudRes = await fetch(signed.uploadUrl, {
    method: "POST",
    body: form,
  });
  const cloudJson = (await cloudRes.json()) as CloudinaryUploadResponse;
  if (!cloudRes.ok || !cloudJson.secure_url) {
    throw new Error(
      cloudJson.error?.message ??
        `Cloudinary upload failed (${cloudRes.status})`,
    );
  }
  return cloudJson.secure_url;
}

const MAX = 5;

export default function SellPhotosPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>(Array(MAX).fill(null));
  const [mainIndex, setMainIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => apiFetch<ListingDetail>(`/listings/${listingId}`),
  });

  useEffect(() => {
    if (!listing || hydrated) return;
    const next: Slot[] = Array(MAX).fill(null);
    const sorted = [...(listing.images ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    sorted.slice(0, MAX).forEach((img, i) => {
      next[i] = { preview: img.url, existingUrl: img.url };
    });
    setSlots(next);
    setMainIndex(0);
    setHydrated(true);
  }, [listing, hydrated]);

  const filled = slots.filter(Boolean).length;

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
      if (filled === 0) setMainIndex(idx);
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
    if (mainIndex === i) {
      const first = slots.findIndex((s, idx) => idx !== i && s);
      setMainIndex(first >= 0 ? first : 0);
    }
  }

  async function uploadAndContinue() {
    const ordered = slots
      .map((s, i) => ({ s, i }))
      .filter((x) => x.s)
      .sort((a, b) => {
        if (a.i === mainIndex) return -1;
        if (b.i === mainIndex) return 1;
        return a.i - b.i;
      });

    if (ordered.length === 0) {
      setError("Add at least one photo to continue.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
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
      router.push(`/sell/${listingId}/details`);
    } catch (e) {
      const message = getErrorToastMessage(e, "Upload failed.");
      setError(message);
      toast("Upload failed.", "error", e);
      setBusy(false);
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
      <h1 className="text-2xl font-semibold">Add photos</h1>
      <p className="mt-1 text-sm text-muted">
        Up to 5 photos. Tap a star to set the main cover photo.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />

      <div className="mt-6 grid grid-cols-3 gap-3">
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
                  aria-label="Set as main photo"
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
                  aria-label="Remove"
                  onClick={() => clearSlot(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-text/70 px-2 py-0.5 text-[10px] font-medium text-surface"
                >
                  Remove
                </button>
                {mainIndex === i ? (
                  <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold text-surface">
                    Main
                  </span>
                ) : null}
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

      {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}

      <div className="mt-6">
        <Button
          className="w-full"
          disabled={busy || filled === 0}
          onClick={uploadAndContinue}
        >
          {busy ? <Spinner className="h-4 w-4" /> : null}
          {busy ? "Uploading…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
