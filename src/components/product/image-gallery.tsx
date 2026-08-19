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
      <div className={cn("flex flex-col md:flex-row gap-3 md:gap-4", className)}>
        {sorted.length > 1 ? (
          <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:pr-2 order-2 md:order-1 scrollbar-hide">
            {sorted.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                onMouseEnter={() => setIndex(i)}
                className={cn(
                  "relative h-20 w-16 md:h-32 md:w-24 shrink-0 overflow-hidden rounded-card border-2 transition-all duration-200",
                  i === index ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 64px, 128px"
                />
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className="relative aspect-[4/5] w-full flex-1 overflow-hidden rounded-card border border-card-border bg-accent-soft shadow-card order-1 md:order-2 md:aspect-auto md:h-[calc(100vh-160px)] md:max-h-[720px]"
          onClick={() => setViewerOpen(true)}
          aria-label="Open image viewer"
        >
          {sorted.map((img, i) => (
            <Image
              key={img.url}
              src={img.url}
              alt={alt}
              fill
              priority={i === 0}
              className={cn(
                "object-cover transition-opacity duration-300 ease-in-out",
                i === index ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ))}
          {sorted.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden z-20">
              {sorted.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                    i === index ? "bg-surface" : "bg-surface/50",
                  )}
                />
              ))}
            </div>
          ) : null}
        </button>
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
              {sorted.map((img, i) => (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={alt}
                  fill
                  className={cn(
                    "object-contain transition-opacity duration-300 ease-in-out",
                    i === index ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                  sizes="100vw"
                />
              ))}
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
