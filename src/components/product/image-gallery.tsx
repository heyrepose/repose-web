"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: Array<{ url: string; sortOrder?: number }>;
  alt: string;
  className?: string;
};

export function ImageGallery({ images, alt, className }: Props) {
  const sorted = [...images].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const current = sorted[index]?.url;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!sorted.length) return;
      setIndex((i) => (i + dir + sorted.length) % sorted.length);
    },
    [sorted.length],
  );

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewerOpen, go]);

  if (!sorted.length) {
    return (
      <div
        className={cn(
          "flex aspect-[4/5] items-center justify-center rounded-card bg-accent-soft text-muted",
          className,
        )}
      >
        No photo
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex flex-col gap-3", className)}>
        <button
          type="button"
          className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-card-border bg-accent-soft shadow-card"
          onClick={() => setViewerOpen(true)}
          aria-label="Open image viewer"
        >
          <Image
            src={current}
            alt={alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {sorted.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {sorted.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === index ? "bg-surface" : "bg-surface/50",
                  )}
                />
              ))}
            </div>
          ) : null}
        </button>

        {sorted.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-16 w-14 shrink-0 overflow-hidden rounded-card border-2",
                  i === index ? "border-primary" : "border-transparent",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {viewerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-text animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 text-surface">
            <span className="text-sm">
              {index + 1} / {sorted.length}
            </span>
            <button
              type="button"
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4">
            {sorted.length > 1 ? (
              <button
                type="button"
                aria-label="Previous"
                className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/20 text-surface"
                onClick={() => go(-1)}
              >
                <ChevronLeft />
              </button>
            ) : null}
            <div className="relative h-full max-h-[80vh] w-full max-w-lg">
              <Image
                src={sorted[index].url}
                alt={alt}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {sorted.length > 1 ? (
              <button
                type="button"
                aria-label="Next"
                className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/20 text-surface"
                onClick={() => go(1)}
              >
                <ChevronRight />
              </button>
            ) : null}
          </div>
          <div className="flex justify-center gap-2 pb-8">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 w-2 rounded-full",
                  i === index ? "bg-surface" : "bg-surface/40",
                )}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
