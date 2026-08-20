"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: Array<{ url: string; sortOrder?: number }>;
  alt: string;
  className?: string;
  sold?: boolean;
};

export function ImageGallery({ images, alt, className, sold }: Props) {
  const sorted = [...images].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const current = sorted[index]?.url;
  const multi = sorted.length > 1;

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
          "flex aspect-[4/5] items-center justify-center rounded-[28px] bg-accent-soft text-sm text-muted shadow-card",
          className,
        )}
      >
        No photo
      </div>
    );
  }

  return (
    <>
      <div className={cn("relative", className)}>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-accent-soft shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            className="absolute inset-0 z-0"
            onClick={() => setViewerOpen(true)}
            aria-label="Open full image"
          >
            <Image
              src={current}
              alt={alt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 520px"
            />
          </button>

          {sold ? (
            <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-text/40">
              <span className="rounded-pill bg-surface px-5 py-2 text-sm font-bold tracking-[0.2em] text-text">
                SOLD
              </span>
            </div>
          ) : null}

          {multi ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-text shadow-card"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-text shadow-card"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>

              <div className="pointer-events-none absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 gap-2">
                {sorted.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      i === index
                        ? "bg-primary"
                        : "bg-surface/90 ring-1 ring-text/10",
                    )}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {viewerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-text animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 text-surface">
            <span className="text-sm tabular-nums">
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
            {multi ? (
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
            {multi ? (
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
